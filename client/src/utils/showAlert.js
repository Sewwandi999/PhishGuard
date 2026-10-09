export function showAlert(title, message) {
  const text = message ? `${title}\n\n${message}` : title;
  window.alert(text);
}
