export default function httpError(status, message, extra) {
  return Object.assign(new Error(message), { status, expose: true }, extra);
}
