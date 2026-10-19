"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaSession = void 0;

require("source-map-support/register");

var _sigaaTypes = require("../sigaa-types");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @category Internal
 */
class SigaaSession {
  constructor(institution) {
    this.institution = institution;

    _defineProperty(this, "loginStatus", _sigaaTypes.LoginStatus.Unauthenticated);
  }

}

exports.SigaaSession = SigaaSession;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXNzaW9uL3NpZ2FhLXNlc3Npb24udHMiXSwibmFtZXMiOlsiU2lnYWFTZXNzaW9uIiwiY29uc3RydWN0b3IiLCJpbnN0aXR1dGlvbiIsIkxvZ2luU3RhdHVzIiwiVW5hdXRoZW50aWNhdGVkIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7OztBQVlBO0FBQ0E7QUFDQTtBQUNPLE1BQU1BLFlBQU4sQ0FBc0M7QUFDM0NDLEVBQUFBLFdBQVcsQ0FBaUJDLFdBQWpCLEVBQStDO0FBQUEsU0FBOUJBLFdBQThCLEdBQTlCQSxXQUE4Qjs7QUFBQSx5Q0FDL0JDLHdCQUFZQyxlQURtQjtBQUFFOztBQURqQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExvZ2luU3RhdHVzIH0gZnJvbSAnLi4vc2lnYWEtdHlwZXMnO1xyXG5pbXBvcnQgeyBJbnN0aXR1dGlvblR5cGUgfSBmcm9tICcuL3NpZ2FhLWluc3RpdHV0aW9uLWNvbnRyb2xsZXInO1xyXG5cclxuLyoqXHJcbiAqIFNpZ2FhIHNlc3Npb24gY29udHJvbFxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgU2Vzc2lvbiB7XHJcbiAgcmVhZG9ubHkgaW5zdGl0dXRpb246IEluc3RpdHV0aW9uVHlwZTtcclxuICBsb2dpblN0YXR1czogTG9naW5TdGF0dXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBjbGFzcyBTaWdhYVNlc3Npb24gaW1wbGVtZW50cyBTZXNzaW9uIHtcclxuICBjb25zdHJ1Y3RvcihwdWJsaWMgcmVhZG9ubHkgaW5zdGl0dXRpb246IEluc3RpdHV0aW9uVHlwZSkge31cclxuICBsb2dpblN0YXR1czogTG9naW5TdGF0dXMgPSBMb2dpblN0YXR1cy5VbmF1dGhlbnRpY2F0ZWQ7XHJcbn1cclxuIl19