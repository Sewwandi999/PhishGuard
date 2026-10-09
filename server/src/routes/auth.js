const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SystemLog = require('../models/SystemLog');
const { protect } = require('../middleware/auth');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};


router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user'
    });

    // Log action
    await SystemLog.create({
      userId: user._id,
      action: 'user_register',
      details: `User ${email} registered successfully`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error registering user'
    });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Log failed attempt
      await SystemLog.create({
        action: 'user_login',
        details: `Failed login attempt for ${email} - user not found`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please use Login with Google.',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      // Log failed attempt
      await SystemLog.create({
        userId: user._id,
        action: 'user_login',
        details: `Failed login attempt for ${email} - invalid password`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure'
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await SystemLog.create({
      userId: user._id,
      action: 'user_login',
      details: `User ${email} logged in successfully`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in'
    });
  }
});

function googleAudiences() {
  const raw = process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const googleHandoffs = new Map();

function pruneGoogleHandoffs() {
  const now = Date.now();
  for (const [id, row] of googleHandoffs) {
    if (row.expires < now) googleHandoffs.delete(id);
  }
}

function openLocalBrowser(url) {
  const { spawn } = require('child_process');
  if (process.platform === 'win32') {
    spawn(
      'powershell.exe',
      ['-NoProfile', '-Command', `Start-Process '${url.replace(/'/g, "''")}'`],
      { detached: true, stdio: 'ignore' },
    ).unref();
  }
}

router.post('/google/mobile-handoff/start', (req, res) => {
  pruneGoogleHandoffs();
  const id = require('crypto').randomBytes(24).toString('hex');
  googleHandoffs.set(id, { status: 'pending', expires: Date.now() + 5 * 60 * 1000 });
  const front = String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const url = `${front}/mobile-google?session=${id}`;
  openLocalBrowser(url);
  return res.json({ success: true, sessionId: id, url });
});

router.get('/google/mobile-handoff/:id', (req, res) => {
  pruneGoogleHandoffs();
  const row = googleHandoffs.get(req.params.id);
  if (!row) {
    return res.status(404).json({ success: false, message: 'This Google sign-in expired. Try again from the phone.' });
  }
  if (row.status !== 'complete') {
    return res.json({ success: true, status: row.status, message: row.message || '' });
  }
  googleHandoffs.delete(req.params.id);
  return res.json({ success: true, status: 'complete', token: row.token, user: row.user });
});

router.post('/google/mobile-handoff/:id', async (req, res) => {
  try {
    pruneGoogleHandoffs();
    const row = googleHandoffs.get(req.params.id);
    if (!row || row.status === 'complete') {
      return res.status(404).json({ success: false, message: 'This Google sign-in expired. Try again from the phone.' });
    }
    const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Missing Google ID token.' });
    }
    const verified = await payloadFromIdToken(idToken);
    if (verified.error) {
      row.status = 'error';
      row.message = verified.error.message;
      return res.status(verified.error.status).json({ success: false, message: verified.error.message });
    }
    const session = await sessionForGoogleProfile(req, verified.payload);
    if (session.error) {
      row.status = 'error';
      row.message = session.error.message;
      return res.status(session.error.status).json({ success: false, message: session.error.message });
    }
    row.status = 'complete';
    row.token = session.body.token;
    row.user = session.body.user;
    return res.json({ success: true });
  } catch (error) {
    console.error('Google mobile handoff error:', error);
    return res.status(401).json({ success: false, message: 'Google Sign-In failed.' });
  }
});

function mobileRedirectUri() {
  return String(process.env.GOOGLE_MOBILE_REDIRECT_URI || '').trim();
}

function appReturnUrl(value) {
  let url;
  try {
    url = new URL(String(value || ''));
  } catch {
    return null;
  }
  if (url.protocol !== 'exp:' && url.protocol !== 'exps:' && url.protocol !== 'phishguard:') {
    return null;
  }
  return url;
}

async function sessionForGoogleProfile(req, payload) {
  const googleId = payload?.sub;
  const email = String(payload?.email || '').toLowerCase().trim();
  const name = String(payload?.name || email.split('@')[0] || 'Google User').trim();
  if (!googleId || !email) {
    return { error: { status: 401, message: 'Google account did not return a verified email.' } };
  }
  if (payload.email_verified === false) {
    return { error: { status: 401, message: 'Google email is not verified.' } };
  }

  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
      role: 'user',
    });
    await SystemLog.create({
      userId: user._id,
      action: 'user_register',
      details: `User ${email} registered with Google`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success',
    });
  } else {
    if (!user.isActive) {
      return { error: { status: 401, message: 'Account is deactivated. Please contact administrator.' } };
    }
    if (!user.googleId) {
      user.googleId = googleId;
    }
    user.lastLogin = new Date();
    await user.save();
  }

  await SystemLog.create({
    userId: user._id,
    action: 'user_login',
    details: `User ${email} logged in with Google`,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success',
  });

  return {
    body: {
      success: true,
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    },
  };
}

async function payloadFromIdToken(idToken) {
  const audiences = googleAudiences();
  if (audiences.length === 0) {
    return { error: { status: 500, message: 'Google Sign-In is not configured on the server. Set GOOGLE_CLIENT_ID in server/.env' } };
  }
  const { OAuth2Client } = require('google-auth-library');
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({ idToken, audience: audiences });
  return { payload: ticket.getPayload() };
}

router.get('/google/mobile-config', (req, res) => {
  const clientId = googleAudiences()[0] || '';
  const redirectUri = mobileRedirectUri();
  if (!clientId || !redirectUri) {
    return res.status(500).json({
      success: false,
      message: 'Mobile Google Sign-In is not configured. Set GOOGLE_MOBILE_REDIRECT_URI in server/.env and add that exact URL as an Authorized redirect URI on the Web client.',
    });
  }
  return res.json({ success: true, clientId, redirectUri });
});

router.get('/google/mobile/callback', (req, res) => {
  let returnUrl;
  try {
    returnUrl = decodeURIComponent(String(req.query.state || ''));
  } catch {
    returnUrl = '';
  }
  const target = appReturnUrl(returnUrl);
  if (!target) {
    return res.status(400).send('Google sign-in could not return to the app.');
  }
  const code = typeof req.query.code === 'string' ? req.query.code : '';
  const error = typeof req.query.error === 'string' ? req.query.error : '';
  if (code) target.searchParams.set('code', code);
  if (error) target.searchParams.set('error', error);
  const next = target.toString();
  const href = next.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  res.set('Content-Type', 'text/html; charset=utf-8');
  return res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Returning to PhishGuard</title></head>
<body>
<p><a href="${href}">Return to PhishGuard</a></p>
<script>location.replace(${JSON.stringify(next)});</script>
</body></html>`);
});

router.post('/google/mobile', async (req, res) => {
  try {
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : '';
    const codeVerifier = typeof req.body?.codeVerifier === 'string' ? req.body.codeVerifier.trim() : '';
    const redirectUri = mobileRedirectUri();
    const clientId = googleAudiences()[0] || '';
    if (!code || !codeVerifier) {
      return res.status(400).json({ success: false, message: 'Missing Google sign-in code.' });
    }
    if (!clientId || !redirectUri) {
      return res.status(500).json({
        success: false,
        message: 'Set GOOGLE_CLIENT_ID and GOOGLE_MOBILE_REDIRECT_URI in server/.env',
      });
    }

    const body = new URLSearchParams({
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });
    if (process.env.GOOGLE_CLIENT_SECRET) {
      body.set('client_secret', process.env.GOOGLE_CLIENT_SECRET);
    }
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const tokenJson = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok || !tokenJson.id_token) {
      const detail = tokenJson.error_description || tokenJson.error || 'Google token exchange failed';
      const needsSecret = /client_secret|invalid_client/i.test(String(detail));
      return res.status(401).json({
        success: false,
        message: needsSecret
          ? 'Google needs the Web client secret. Set GOOGLE_CLIENT_SECRET in server/.env and restart the API.'
          : `Google Sign-In failed. ${detail}`,
      });
    }

    const verified = await payloadFromIdToken(tokenJson.id_token);
    if (verified.error) {
      return res.status(verified.error.status).json({ success: false, message: verified.error.message });
    }
    const session = await sessionForGoogleProfile(req, verified.payload);
    if (session.error) {
      return res.status(session.error.status).json({ success: false, message: session.error.message });
    }
    return res.json(session.body);
  } catch (error) {
    console.error('Google mobile login error:', error);
    return res.status(401).json({ success: false, message: 'Google Sign-In failed.' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const idToken = typeof req.body?.idToken === 'string' ? req.body.idToken.trim() : '';
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Missing Google ID token.' });
    }
    const verified = await payloadFromIdToken(idToken);
    if (verified.error) {
      return res.status(verified.error.status).json({ success: false, message: verified.error.message });
    }
    const session = await sessionForGoogleProfile(req, verified.payload);
    if (session.error) {
      return res.status(session.error.status).json({ success: false, message: session.error.message });
    }
    return res.json(session.body);
  } catch (error) {
    console.error('Google login error:', error);
    const reason = error instanceof Error ? error.message : String(error);
    const tlsIssue = /certificate|UNABLE_TO_VERIFY|CERT/i.test(reason);
    return res.status(401).json({
      success: false,
      message: tlsIssue
        ? 'Google Sign-In could not verify the token (local HTTPS certificate intercept). Restart the API after the TLS development setting, then try again.'
        : 'Google Sign-In failed. Check GOOGLE_CLIENT_ID and authorized JavaScript origins (http://localhost:5173).',
    });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data'
    });
  }
});


router.post('/logout', protect, async (req, res) => {
  try {
    // Log logout
    await SystemLog.create({
      userId: req.user.id,
      action: 'user_logout',
      details: `User ${req.user.email} logged out`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out'
    });
  }
});

module.exports = router;