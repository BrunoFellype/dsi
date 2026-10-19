"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaBondController = void 0;

require("source-map-support/register");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Class to store current bond.
 * @category Internal
 */
class SigaaBondController {
  constructor() {
    _defineProperty(this, "_currentBond", null);
  }

  set currentBond(value) {
    this._currentBond = value;
  }

  get currentBond() {
    return this._currentBond;
  }

}

exports.SigaaBondController = SigaaBondController;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXNzaW9uL3NpZ2FhLWJvbmQtY29udHJvbGxlci50cyJdLCJuYW1lcyI6WyJTaWdhYUJvbmRDb250cm9sbGVyIiwiY3VycmVudEJvbmQiLCJ2YWx1ZSIsIl9jdXJyZW50Qm9uZCJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU1BLG1CQUFOLENBQW9EO0FBQUE7QUFBQSwwQ0FDdEIsSUFEc0I7QUFBQTs7QUFHMUMsTUFBWEMsV0FBVyxDQUFDQyxLQUFELEVBQW9CO0FBQ2pDLFNBQUtDLFlBQUwsR0FBb0JELEtBQXBCO0FBQ0Q7O0FBQ2MsTUFBWEQsV0FBVyxHQUFlO0FBQzVCLFdBQU8sS0FBS0UsWUFBWjtBQUNEOztBQVJ3RCIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxyXG4gKiBJbnRlcmZhY2UgdGhhdCBhYnN0cmFjdHMgdGhlIGNsYXNzIHRoYXQgc3RvcmVzIHRoZSBjdXJyZW50IGJvbmQuXHJcbiAqIEBjYXRlZ29yeSBJbnRlcm5hbFxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBCb25kQ29udHJvbGxlciB7XHJcbiAgY3VycmVudEJvbmQ6IFVSTCB8IG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbGFzcyB0byBzdG9yZSBjdXJyZW50IGJvbmQuXHJcbiAqIEBjYXRlZ29yeSBJbnRlcm5hbFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFNpZ2FhQm9uZENvbnRyb2xsZXIgaW1wbGVtZW50cyBCb25kQ29udHJvbGxlciB7XHJcbiAgcHJpdmF0ZSBfY3VycmVudEJvbmQ6IFVSTCB8IG51bGwgPSBudWxsO1xyXG5cclxuICBzZXQgY3VycmVudEJvbmQodmFsdWU6IFVSTCB8IG51bGwpIHtcclxuICAgIHRoaXMuX2N1cnJlbnRCb25kID0gdmFsdWU7XHJcbiAgfVxyXG4gIGdldCBjdXJyZW50Qm9uZCgpOiBVUkwgfCBudWxsIHtcclxuICAgIHJldHVybiB0aGlzLl9jdXJyZW50Qm9uZDtcclxuICB9XHJcbn1cclxuIl19