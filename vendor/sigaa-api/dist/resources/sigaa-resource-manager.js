"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ResourceManager = void 0;

require("source-map-support/register");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @category Internal
 */
class ResourceManager {
  constructor(instanceConstructor) {
    this.instanceConstructor = instanceConstructor;

    _defineProperty(this, "_instances", []);
  }
  /**
   * Current instances.
   */


  /**
   * Closes and removes the instance if not in idsToKeep.
   * @param idsToKeep array with ids to keep E.g. ["1234", "4321"]
   */
  keepOnly(idsToKeep) {
    this._instances = this._instances.filter(instance => {
      try {
        if (idsToKeep.includes(instance._instanceIndentifier)) {
          return true;
        } else {
          instance.close();
          return false;
        }
      } catch (err) {
        return false;
      }
    });
    return this._instances;
  }
  /**
   * @inheritdoc
   */


  get instances() {
    return this._instances;
  }
  /**
   * Update instance with new information
   * If there is an instance with the instanceIndentifier equal to
   * options.instanceIndentifier, the update method will be called with
   * instanceOptions.
   * E.g. instance.update(options.instanceOptions)
   * or create new instance with constructor.
   * @param options Object with new informations
   * @return return the instance updated/created
   */


  upsert(options) {
    const id = options.instanceIndentifier;

    const instance = this._instances.find(classItem => id === classItem._instanceIndentifier);

    if (!instance) {
      const newInstance = this.instanceConstructor(options);

      this._instances.push(newInstance);

      return newInstance;
    } else {
      instance.update(options);
      return instance;
    }
  }

  close() {
    for (const instance of this.instances) {
      instance.close();
    }

    this._instances = [];
  }

}

exports.ResourceManager = ResourceManager;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yZXNvdXJjZXMvc2lnYWEtcmVzb3VyY2UtbWFuYWdlci50cyJdLCJuYW1lcyI6WyJSZXNvdXJjZU1hbmFnZXIiLCJjb25zdHJ1Y3RvciIsImluc3RhbmNlQ29uc3RydWN0b3IiLCJrZWVwT25seSIsImlkc1RvS2VlcCIsIl9pbnN0YW5jZXMiLCJmaWx0ZXIiLCJpbnN0YW5jZSIsImluY2x1ZGVzIiwiX2luc3RhbmNlSW5kZW50aWZpZXIiLCJjbG9zZSIsImVyciIsImluc3RhbmNlcyIsInVwc2VydCIsIm9wdGlvbnMiLCJpZCIsImluc3RhbmNlSW5kZW50aWZpZXIiLCJmaW5kIiwiY2xhc3NJdGVtIiwibmV3SW5zdGFuY2UiLCJwdXNoIiwidXBkYXRlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVNBO0FBQ0E7QUFDQTtBQUNPLE1BQU1BLGVBQU4sQ0FHNEI7QUFDakNDLEVBQUFBLFdBQVcsQ0FBU0MsbUJBQVQsRUFBaUQ7QUFBQSxTQUF4Q0EsbUJBQXdDLEdBQXhDQSxtQkFBd0M7O0FBQUEsd0NBS2xDLEVBTGtDO0FBQUU7QUFFOUQ7QUFDRjtBQUNBOzs7QUFHRTtBQUNGO0FBQ0E7QUFDQTtBQUNFQyxFQUFBQSxRQUFRLENBQUNDLFNBQUQsRUFBMkI7QUFDakMsU0FBS0MsVUFBTCxHQUFrQixLQUFLQSxVQUFMLENBQWdCQyxNQUFoQixDQUF3QkMsUUFBRCxJQUFjO0FBQ3JELFVBQUk7QUFDRixZQUFJSCxTQUFTLENBQUNJLFFBQVYsQ0FBbUJELFFBQVEsQ0FBQ0Usb0JBQTVCLENBQUosRUFBdUQ7QUFDckQsaUJBQU8sSUFBUDtBQUNELFNBRkQsTUFFTztBQUNMRixVQUFBQSxRQUFRLENBQUNHLEtBQVQ7QUFDQSxpQkFBTyxLQUFQO0FBQ0Q7QUFDRixPQVBELENBT0UsT0FBT0MsR0FBUCxFQUFZO0FBQ1osZUFBTyxLQUFQO0FBQ0Q7QUFDRixLQVhpQixDQUFsQjtBQVlBLFdBQU8sS0FBS04sVUFBWjtBQUNEO0FBRUQ7QUFDRjtBQUNBOzs7QUFDZSxNQUFUTyxTQUFTLEdBQVE7QUFDbkIsV0FBTyxLQUFLUCxVQUFaO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBQ0VRLEVBQUFBLE1BQU0sQ0FBQ0MsT0FBRCxFQUFnQjtBQUNwQixVQUFNQyxFQUFFLEdBQUdELE9BQU8sQ0FBQ0UsbUJBQW5COztBQUNBLFVBQU1ULFFBQVEsR0FBRyxLQUFLRixVQUFMLENBQWdCWSxJQUFoQixDQUNkQyxTQUFELElBQWVILEVBQUUsS0FBS0csU0FBUyxDQUFDVCxvQkFEakIsQ0FBakI7O0FBSUEsUUFBSSxDQUFDRixRQUFMLEVBQWU7QUFDYixZQUFNWSxXQUFXLEdBQUcsS0FBS2pCLG1CQUFMLENBQXlCWSxPQUF6QixDQUFwQjs7QUFDQSxXQUFLVCxVQUFMLENBQWdCZSxJQUFoQixDQUFxQkQsV0FBckI7O0FBQ0EsYUFBT0EsV0FBUDtBQUNELEtBSkQsTUFJTztBQUNMWixNQUFBQSxRQUFRLENBQUNjLE1BQVQsQ0FBZ0JQLE9BQWhCO0FBQ0EsYUFBT1AsUUFBUDtBQUNEO0FBQ0Y7O0FBRURHLEVBQUFBLEtBQUssR0FBUztBQUNaLFNBQUssTUFBTUgsUUFBWCxJQUF1QixLQUFLSyxTQUE1QixFQUF1QztBQUNyQ0wsTUFBQUEsUUFBUSxDQUFDRyxLQUFUO0FBQ0Q7O0FBQ0QsU0FBS0wsVUFBTCxHQUFrQixFQUFsQjtBQUNEOztBQWxFZ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBVcGRhdGFibGVSZXNvdXJjZSB9IGZyb20gJ0ByZXNvdXJjZXMvdXBkYXRhYmxlLXJlc291cmNlJztcclxuXHJcbi8qKlxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgVXBkYXRhYmxlUmVzb3VyY2VEYXRhIHtcclxuICBpbnN0YW5jZUluZGVudGlmaWVyOiBzdHJpbmc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBjbGFzcyBSZXNvdXJjZU1hbmFnZXI8XHJcbiAgVCBleHRlbmRzIFVwZGF0YWJsZVJlc291cmNlPFU+LFxyXG4gIFUgZXh0ZW5kcyBVcGRhdGFibGVSZXNvdXJjZURhdGFcclxuPiBpbXBsZW1lbnRzIFJlc291cmNlTWFuYWdlcjxULCBVPiB7XHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBpbnN0YW5jZUNvbnN0cnVjdG9yOiAob3B0aW9uczogVSkgPT4gVCkge31cclxuXHJcbiAgLyoqXHJcbiAgICogQ3VycmVudCBpbnN0YW5jZXMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfaW5zdGFuY2VzOiBUW10gPSBbXTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2xvc2VzIGFuZCByZW1vdmVzIHRoZSBpbnN0YW5jZSBpZiBub3QgaW4gaWRzVG9LZWVwLlxyXG4gICAqIEBwYXJhbSBpZHNUb0tlZXAgYXJyYXkgd2l0aCBpZHMgdG8ga2VlcCBFLmcuIFtcIjEyMzRcIiwgXCI0MzIxXCJdXHJcbiAgICovXHJcbiAga2VlcE9ubHkoaWRzVG9LZWVwOiBzdHJpbmdbXSk6IFRbXSB7XHJcbiAgICB0aGlzLl9pbnN0YW5jZXMgPSB0aGlzLl9pbnN0YW5jZXMuZmlsdGVyKChpbnN0YW5jZSkgPT4ge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGlmIChpZHNUb0tlZXAuaW5jbHVkZXMoaW5zdGFuY2UuX2luc3RhbmNlSW5kZW50aWZpZXIpKSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgaW5zdGFuY2UuY2xvc2UoKTtcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQGluaGVyaXRkb2NcclxuICAgKi9cclxuICBnZXQgaW5zdGFuY2VzKCk6IFRbXSB7XHJcbiAgICByZXR1cm4gdGhpcy5faW5zdGFuY2VzO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogVXBkYXRlIGluc3RhbmNlIHdpdGggbmV3IGluZm9ybWF0aW9uXHJcbiAgICogSWYgdGhlcmUgaXMgYW4gaW5zdGFuY2Ugd2l0aCB0aGUgaW5zdGFuY2VJbmRlbnRpZmllciBlcXVhbCB0b1xyXG4gICAqIG9wdGlvbnMuaW5zdGFuY2VJbmRlbnRpZmllciwgdGhlIHVwZGF0ZSBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgd2l0aFxyXG4gICAqIGluc3RhbmNlT3B0aW9ucy5cclxuICAgKiBFLmcuIGluc3RhbmNlLnVwZGF0ZShvcHRpb25zLmluc3RhbmNlT3B0aW9ucylcclxuICAgKiBvciBjcmVhdGUgbmV3IGluc3RhbmNlIHdpdGggY29uc3RydWN0b3IuXHJcbiAgICogQHBhcmFtIG9wdGlvbnMgT2JqZWN0IHdpdGggbmV3IGluZm9ybWF0aW9uc1xyXG4gICAqIEByZXR1cm4gcmV0dXJuIHRoZSBpbnN0YW5jZSB1cGRhdGVkL2NyZWF0ZWRcclxuICAgKi9cclxuICB1cHNlcnQob3B0aW9uczogVSk6IFQge1xyXG4gICAgY29uc3QgaWQgPSBvcHRpb25zLmluc3RhbmNlSW5kZW50aWZpZXI7XHJcbiAgICBjb25zdCBpbnN0YW5jZSA9IHRoaXMuX2luc3RhbmNlcy5maW5kKFxyXG4gICAgICAoY2xhc3NJdGVtKSA9PiBpZCA9PT0gY2xhc3NJdGVtLl9pbnN0YW5jZUluZGVudGlmaWVyXHJcbiAgICApO1xyXG5cclxuICAgIGlmICghaW5zdGFuY2UpIHtcclxuICAgICAgY29uc3QgbmV3SW5zdGFuY2UgPSB0aGlzLmluc3RhbmNlQ29uc3RydWN0b3Iob3B0aW9ucyk7XHJcbiAgICAgIHRoaXMuX2luc3RhbmNlcy5wdXNoKG5ld0luc3RhbmNlKTtcclxuICAgICAgcmV0dXJuIG5ld0luc3RhbmNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaW5zdGFuY2UudXBkYXRlKG9wdGlvbnMpO1xyXG4gICAgICByZXR1cm4gaW5zdGFuY2U7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBjbG9zZSgpOiB2b2lkIHtcclxuICAgIGZvciAoY29uc3QgaW5zdGFuY2Ugb2YgdGhpcy5pbnN0YW5jZXMpIHtcclxuICAgICAgaW5zdGFuY2UuY2xvc2UoKTtcclxuICAgIH1cclxuICAgIHRoaXMuX2luc3RhbmNlcyA9IFtdO1xyXG4gIH1cclxufVxyXG4iXX0=