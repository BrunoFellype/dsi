"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.saveDebugPage = saveDebugPage;

require("source-map-support/register");

var fs = _interopRequireWildcard(require("fs"));

var path = _interopRequireWildcard(require("path"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * Saves the page HTML when the environment variable SIGAA_DEBUG_DIR is set.
 * Used to adapt the parsers to the layout of a new institution.
 * The file may contain personal data, it is only written locally.
 * @param name file name without extension.
 * @param page page to save.
 * @category Internal
 */
function saveDebugPage(name, page) {
  // No celular não há `process.env` de verdade: sem pasta de depuração, não grava nada
  const debugDir = typeof process !== 'undefined' && process.env ? process.env.SIGAA_DEBUG_DIR : undefined;
  if (!debugDir) return;

  try {
    fs.mkdirSync(debugDir, {
      recursive: true
    });
    const filePath = path.join(debugDir, `${name}.html`);
    fs.writeFileSync(filePath, `<!-- ${page.url.href} -->\n${page.bodyDecoded}`, 'utf-8');
    console.log(`SIGAA: page saved in ${filePath}`);
  } catch (err) {
    console.log(`SIGAA: could not save debug page: ${err}`);
  }
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9oZWxwZXJzL3NpZ2FhLWRlYnVnLnRzIl0sIm5hbWVzIjpbInNhdmVEZWJ1Z1BhZ2UiLCJuYW1lIiwicGFnZSIsImRlYnVnRGlyIiwicHJvY2VzcyIsImVudiIsIlNJR0FBX0RFQlVHX0RJUiIsImZzIiwibWtkaXJTeW5jIiwicmVjdXJzaXZlIiwiZmlsZVBhdGgiLCJwYXRoIiwiam9pbiIsIndyaXRlRmlsZVN5bmMiLCJ1cmwiLCJocmVmIiwiYm9keURlY29kZWQiLCJjb25zb2xlIiwibG9nIiwiZXJyIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFDQTs7Ozs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLFNBQVNBLGFBQVQsQ0FBdUJDLElBQXZCLEVBQXFDQyxJQUFyQyxFQUF1RDtBQUM1RCxRQUFNQyxRQUFRLEdBQUdDLE9BQU8sQ0FBQ0MsR0FBUixDQUFZQyxlQUE3QjtBQUNBLE1BQUksQ0FBQ0gsUUFBTCxFQUFlOztBQUNmLE1BQUk7QUFDRkksSUFBQUEsRUFBRSxDQUFDQyxTQUFILENBQWFMLFFBQWIsRUFBdUI7QUFBRU0sTUFBQUEsU0FBUyxFQUFFO0FBQWIsS0FBdkI7QUFDQSxVQUFNQyxRQUFRLEdBQUdDLElBQUksQ0FBQ0MsSUFBTCxDQUFVVCxRQUFWLEVBQXFCLEdBQUVGLElBQUssT0FBNUIsQ0FBakI7QUFDQU0sSUFBQUEsRUFBRSxDQUFDTSxhQUFILENBQ0VILFFBREYsRUFFRyxRQUFPUixJQUFJLENBQUNZLEdBQUwsQ0FBU0MsSUFBSyxTQUFRYixJQUFJLENBQUNjLFdBQVksRUFGakQsRUFHRSxPQUhGO0FBS0FDLElBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUFhLHdCQUF1QlIsUUFBUyxFQUE3QztBQUNELEdBVEQsQ0FTRSxPQUFPUyxHQUFQLEVBQVk7QUFDWkYsSUFBQUEsT0FBTyxDQUFDQyxHQUFSLENBQWEscUNBQW9DQyxHQUFJLEVBQXJEO0FBQ0Q7QUFDRiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGZzIGZyb20gJ2ZzJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAnQHNlc3Npb24vc2lnYWEtcGFnZSc7XG5cbi8qKlxuICogU2F2ZXMgdGhlIHBhZ2UgSFRNTCB3aGVuIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZSBTSUdBQV9ERUJVR19ESVIgaXMgc2V0LlxuICogVXNlZCB0byBhZGFwdCB0aGUgcGFyc2VycyB0byB0aGUgbGF5b3V0IG9mIGEgbmV3IGluc3RpdHV0aW9uLlxuICogVGhlIGZpbGUgbWF5IGNvbnRhaW4gcGVyc29uYWwgZGF0YSwgaXQgaXMgb25seSB3cml0dGVuIGxvY2FsbHkuXG4gKiBAcGFyYW0gbmFtZSBmaWxlIG5hbWUgd2l0aG91dCBleHRlbnNpb24uXG4gKiBAcGFyYW0gcGFnZSBwYWdlIHRvIHNhdmUuXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVEZWJ1Z1BhZ2UobmFtZTogc3RyaW5nLCBwYWdlOiBQYWdlKTogdm9pZCB7XG4gIGNvbnN0IGRlYnVnRGlyID0gcHJvY2Vzcy5lbnYuU0lHQUFfREVCVUdfRElSO1xuICBpZiAoIWRlYnVnRGlyKSByZXR1cm47XG4gIHRyeSB7XG4gICAgZnMubWtkaXJTeW5jKGRlYnVnRGlyLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgICBjb25zdCBmaWxlUGF0aCA9IHBhdGguam9pbihkZWJ1Z0RpciwgYCR7bmFtZX0uaHRtbGApO1xuICAgIGZzLndyaXRlRmlsZVN5bmMoXG4gICAgICBmaWxlUGF0aCxcbiAgICAgIGA8IS0tICR7cGFnZS51cmwuaHJlZn0gLS0+XFxuJHtwYWdlLmJvZHlEZWNvZGVkfWAsXG4gICAgICAndXRmLTgnXG4gICAgKTtcbiAgICBjb25zb2xlLmxvZyhgU0lHQUE6IHBhZ2Ugc2F2ZWQgaW4gJHtmaWxlUGF0aH1gKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5sb2coYFNJR0FBOiBjb3VsZCBub3Qgc2F2ZSBkZWJ1ZyBwYWdlOiAke2Vycn1gKTtcbiAgfVxufVxuIl19