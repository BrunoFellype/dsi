"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaPromiseStack = void 0;

require("source-map-support/register");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Class to control promise order
 * Performs chain functions and waits for each promise that the functions return.
 * @category Internal
 */
class SigaaPromiseStack {
  /**
   * Order type.
   * If it is reverse, the last entered will be the first executed. default is normal.
   */

  /**
   * Current promise running object as {key, promiseFunction, promise}.
   */

  /**
   * store all promises objects as {key, promiseFunction, promise}
   */

  /**
   * @param PromiseStackOrder [order] order of execution of the promises, if it is reverse, the last entered will be the first executed. default is normal.
   */
  constructor(order) {
    _defineProperty(this, "order", void 0);

    _defineProperty(this, "promiseRunning", void 0);

    _defineProperty(this, "storedPromises", []);

    this.order = order || 'normal';
  }
  /**
   * @inheritdoc
   */


  flush() {
    this.storedPromises = [];
    this.promiseRunning = undefined;
  }
  /**
   * @inheritdoc
   */


  get promises() {
    if (this.promiseRunning) {
      return [this.promiseRunning, ...this.storedPromises];
    } else {
      return this.storedPromises;
    }
  }
  /**
   * Loop to execute the entire promise stack
   */


  async promiseExecutor() {
    if (!this.promiseRunning) {
      while (this.storedPromises.length > 0) {
        if (this.order === 'normal') {
          this.promiseRunning = this.storedPromises.shift();
        } else if (this.order === 'reverse') {
          this.promiseRunning = this.storedPromises.pop();
        }

        try {
          var _this$promiseRunning;

          if ((_this$promiseRunning = this.promiseRunning) !== null && _this$promiseRunning !== void 0 && _this$promiseRunning.promiseFunction) {
            await this.promiseRunning.promiseFunction();
          }
        } finally {
          this.promiseRunning = undefined;
        }
      }
    }
  }
  /**
   * @inheritdoc
   */


  addPromise(key, promiseFunction) {
    const promiseObject = {
      key
    };
    const promise = new Promise((resolve, reject) => {
      promiseObject.promiseFunction = () => {
        return promiseFunction().then(resolve, reject);
      };
    });
    // Quem chamou recebe a rejeição normalmente; isto só evita "Uncaught (in promise)" quando
    // ninguém espera pela fila (o erro do pedido também é lançado por quem fez a requisição).
    promise.catch(() => {});
    promiseObject.promise = promise;
    this.storedPromises.push(promiseObject);
    this.promiseExecutor();
    return promise;
  }

}

exports.SigaaPromiseStack = SigaaPromiseStack;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9oZWxwZXJzL3NpZ2FhLXByb21pc2Utc3RhY2sudHMiXSwibmFtZXMiOlsiU2lnYWFQcm9taXNlU3RhY2siLCJjb25zdHJ1Y3RvciIsIm9yZGVyIiwiZmx1c2giLCJzdG9yZWRQcm9taXNlcyIsInByb21pc2VSdW5uaW5nIiwidW5kZWZpbmVkIiwicHJvbWlzZXMiLCJwcm9taXNlRXhlY3V0b3IiLCJsZW5ndGgiLCJzaGlmdCIsInBvcCIsInByb21pc2VGdW5jdGlvbiIsImFkZFByb21pc2UiLCJrZXkiLCJwcm9taXNlT2JqZWN0IiwicHJvbWlzZSIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwidGhlbiIsInB1c2giXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBNkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxNQUFNQSxpQkFBTixDQUE0RDtBQUNqRTtBQUNGO0FBQ0E7QUFDQTs7QUFHRTtBQUNGO0FBQ0E7O0FBR0U7QUFDRjtBQUNBOztBQUdFO0FBQ0Y7QUFDQTtBQUNFQyxFQUFBQSxXQUFXLENBQUNDLEtBQUQsRUFBNEI7QUFBQTs7QUFBQTs7QUFBQSw0Q0FMWSxFQUtaOztBQUNyQyxTQUFLQSxLQUFMLEdBQWFBLEtBQUssSUFBSSxRQUF0QjtBQUNEO0FBQ0Q7QUFDRjtBQUNBOzs7QUFDRUMsRUFBQUEsS0FBSyxHQUFTO0FBQ1osU0FBS0MsY0FBTCxHQUFzQixFQUF0QjtBQUNBLFNBQUtDLGNBQUwsR0FBc0JDLFNBQXRCO0FBQ0Q7QUFFRDtBQUNGO0FBQ0E7OztBQUNjLE1BQVJDLFFBQVEsR0FBNkI7QUFDdkMsUUFBSSxLQUFLRixjQUFULEVBQXlCO0FBQ3ZCLGFBQU8sQ0FBQyxLQUFLQSxjQUFOLEVBQXNCLEdBQUcsS0FBS0QsY0FBOUIsQ0FBUDtBQUNELEtBRkQsTUFFTztBQUNMLGFBQU8sS0FBS0EsY0FBWjtBQUNEO0FBQ0Y7QUFFRDtBQUNGO0FBQ0E7OztBQUMrQixRQUFmSSxlQUFlLEdBQWtCO0FBQzdDLFFBQUksQ0FBQyxLQUFLSCxjQUFWLEVBQTBCO0FBQ3hCLGFBQU8sS0FBS0QsY0FBTCxDQUFvQkssTUFBcEIsR0FBNkIsQ0FBcEMsRUFBdUM7QUFDckMsWUFBSSxLQUFLUCxLQUFMLEtBQWUsUUFBbkIsRUFBNkI7QUFDM0IsZUFBS0csY0FBTCxHQUFzQixLQUFLRCxjQUFMLENBQW9CTSxLQUFwQixFQUF0QjtBQUNELFNBRkQsTUFFTyxJQUFJLEtBQUtSLEtBQUwsS0FBZSxTQUFuQixFQUE4QjtBQUNuQyxlQUFLRyxjQUFMLEdBQXNCLEtBQUtELGNBQUwsQ0FBb0JPLEdBQXBCLEVBQXRCO0FBQ0Q7O0FBQ0QsWUFBSTtBQUFBOztBQUNGLHNDQUFJLEtBQUtOLGNBQVQsaURBQUkscUJBQXFCTyxlQUF6QixFQUEwQztBQUN4QyxrQkFBTSxLQUFLUCxjQUFMLENBQW9CTyxlQUFwQixFQUFOO0FBQ0Q7QUFDRixTQUpELFNBSVU7QUFDUixlQUFLUCxjQUFMLEdBQXNCQyxTQUF0QjtBQUNEO0FBQ0Y7QUFDRjtBQUNGO0FBRUQ7QUFDRjtBQUNBOzs7QUFDU08sRUFBQUEsVUFBVSxDQUFDQyxHQUFELEVBQVNGLGVBQVQsRUFBMEQ7QUFDekUsVUFBTUcsYUFBcUMsR0FBRztBQUFFRCxNQUFBQTtBQUFGLEtBQTlDO0FBQ0EsVUFBTUUsT0FBTyxHQUFHLElBQUlDLE9BQUosQ0FBZSxDQUFDQyxPQUFELEVBQVVDLE1BQVYsS0FBcUI7QUFDbERKLE1BQUFBLGFBQWEsQ0FBQ0gsZUFBZCxHQUFnQyxNQUFNO0FBQ3BDLGVBQU9BLGVBQWUsR0FBR1EsSUFBbEIsQ0FBdUJGLE9BQXZCLEVBQWdDQyxNQUFoQyxDQUFQO0FBQ0QsT0FGRDtBQUdELEtBSmUsQ0FBaEI7QUFLQUosSUFBQUEsYUFBYSxDQUFDQyxPQUFkLEdBQXdCQSxPQUF4QjtBQUNBLFNBQUtaLGNBQUwsQ0FBb0JpQixJQUFwQixDQUF5Qk4sYUFBekI7QUFDQSxTQUFLUCxlQUFMO0FBRUEsV0FBT1EsT0FBUDtBQUNEOztBQS9FZ0UiLCJzb3VyY2VzQ29udGVudCI6WyJ0eXBlIFByb21pc2VTdGFja09yZGVyID0gJ25vcm1hbCcgfCAncmV2ZXJzZSc7XHJcblxyXG4vKipcclxuICogQGNhdGVnb3J5IEludGVybmFsXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIEZ1bmN0aW9uUHJvbWlzZTxUPiB7XHJcbiAgKCk6IFByb21pc2U8VD47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJdGVtIGluIHN0YWNrLlxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgUHJvbWlzZUl0ZW1TdGFjazxLLCBUPiB7XHJcbiAga2V5OiBLO1xyXG4gIHByb21pc2VGdW5jdGlvbj8oKTogUHJvbWlzZTx2b2lkPjtcclxuICBwcm9taXNlPzogUHJvbWlzZTxUPjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEFic3RyYWN0aW9uIHRvIHJlcHJlc2VudCBhIGNsYXNzIHRoYXQgcGVyZm9ybXMgY2hhaW4gZnVuY3Rpb25zIGFuZCB3YWl0cyBmb3IgZWFjaCBwcm9taXNlIHRoYXQgdGhlIGZ1bmN0aW9ucyByZXR1cm4uXHJcbiAqIEBjYXRlZ29yeSBJbnRlcm5hbFxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBQcm9taXNlU3RhY2s8SywgVD4ge1xyXG4gIC8qKlxyXG4gICAqIEFkZCBwcm9taXNlIGluIHN0YWNrLlxyXG4gICAqIFRoZSBmdW5jdGlvbiBpcyBub3QgY2FsbGVkIHRoZSBtb21lbnQgaXQgaXMgYWRkZWQgdG8gdGhlIHN0YWNrLCBidXQgd2hlbiBpdCBpcyB5b3VyIHR1cm4gb24gdGhlIHN0YWNrXHJcbiAgICogQHBhcmFtIHByb21pc2VGdW5jdGlvbiBmdW5jdGlvbiB0byBnZW5lcmF0ZSB0aGUgcHJvbWlzZVxyXG4gICAqIEBwYXJhbSBrZXkgS2V5IG9mIHByb21pc2UgYXJyYXksIHRvIGlkZW50aWZ5IGEgZnVuY3Rpb24uXHJcbiAgICogQHJldHVybnMgQSBwcm9taXNlIHRoYXQgcmVzb2x2ZXMgd2l0aCB0aGUgZnVuY3Rpb24ncyByZXNwb25zZS5cclxuICAgKi9cclxuICBhZGRQcm9taXNlKGtleTogSywgcHJvbWlzZUZ1bmN0aW9uOiBGdW5jdGlvblByb21pc2U8VD4pOiBQcm9taXNlPFQ+O1xyXG5cclxuICAvKipcclxuICAgKiBHZXQgcHJvbWlzZXMgb2JqZWN0cy5cclxuICAgKiBSZXR1cm5zIHRoZSBmdW5jdGlvbnMgdGhhdCBhcmUgc3RpbGwgaW4gdGhlIHN0YWNrLlxyXG4gICAqL1xyXG4gIHJlYWRvbmx5IHByb21pc2VzOiBQcm9taXNlSXRlbVN0YWNrPEssIFQ+W107XHJcblxyXG4gIC8qKlxyXG4gICAqIGZsdXNoIHRoZSBzdGFjay5cclxuICAgKi9cclxuICBmbHVzaCgpOiB2b2lkO1xyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgdG8gY29udHJvbCBwcm9taXNlIG9yZGVyXHJcbiAqIFBlcmZvcm1zIGNoYWluIGZ1bmN0aW9ucyBhbmQgd2FpdHMgZm9yIGVhY2ggcHJvbWlzZSB0aGF0IHRoZSBmdW5jdGlvbnMgcmV0dXJuLlxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBjbGFzcyBTaWdhYVByb21pc2VTdGFjazxLLCBUPiBpbXBsZW1lbnRzIFByb21pc2VTdGFjazxLLCBUPiB7XHJcbiAgLyoqXHJcbiAgICogT3JkZXIgdHlwZS5cclxuICAgKiBJZiBpdCBpcyByZXZlcnNlLCB0aGUgbGFzdCBlbnRlcmVkIHdpbGwgYmUgdGhlIGZpcnN0IGV4ZWN1dGVkLiBkZWZhdWx0IGlzIG5vcm1hbC5cclxuICAgKi9cclxuICBwcml2YXRlIG9yZGVyOiBQcm9taXNlU3RhY2tPcmRlcjtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3VycmVudCBwcm9taXNlIHJ1bm5pbmcgb2JqZWN0IGFzIHtrZXksIHByb21pc2VGdW5jdGlvbiwgcHJvbWlzZX0uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwcm9taXNlUnVubmluZz86IFByb21pc2VJdGVtU3RhY2s8SywgVD47XHJcblxyXG4gIC8qKlxyXG4gICAqIHN0b3JlIGFsbCBwcm9taXNlcyBvYmplY3RzIGFzIHtrZXksIHByb21pc2VGdW5jdGlvbiwgcHJvbWlzZX1cclxuICAgKi9cclxuICBwcml2YXRlIHN0b3JlZFByb21pc2VzOiBQcm9taXNlSXRlbVN0YWNrPEssIFQ+W10gPSBbXTtcclxuXHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIFByb21pc2VTdGFja09yZGVyIFtvcmRlcl0gb3JkZXIgb2YgZXhlY3V0aW9uIG9mIHRoZSBwcm9taXNlcywgaWYgaXQgaXMgcmV2ZXJzZSwgdGhlIGxhc3QgZW50ZXJlZCB3aWxsIGJlIHRoZSBmaXJzdCBleGVjdXRlZC4gZGVmYXVsdCBpcyBub3JtYWwuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3Iob3JkZXI/OiBQcm9taXNlU3RhY2tPcmRlcikge1xyXG4gICAgdGhpcy5vcmRlciA9IG9yZGVyIHx8ICdub3JtYWwnO1xyXG4gIH1cclxuICAvKipcclxuICAgKiBAaW5oZXJpdGRvY1xyXG4gICAqL1xyXG4gIGZsdXNoKCk6IHZvaWQge1xyXG4gICAgdGhpcy5zdG9yZWRQcm9taXNlcyA9IFtdO1xyXG4gICAgdGhpcy5wcm9taXNlUnVubmluZyA9IHVuZGVmaW5lZDtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBpbmhlcml0ZG9jXHJcbiAgICovXHJcbiAgZ2V0IHByb21pc2VzKCk6IFByb21pc2VJdGVtU3RhY2s8SywgVD5bXSB7XHJcbiAgICBpZiAodGhpcy5wcm9taXNlUnVubmluZykge1xyXG4gICAgICByZXR1cm4gW3RoaXMucHJvbWlzZVJ1bm5pbmcsIC4uLnRoaXMuc3RvcmVkUHJvbWlzZXNdO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIHRoaXMuc3RvcmVkUHJvbWlzZXM7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBMb29wIHRvIGV4ZWN1dGUgdGhlIGVudGlyZSBwcm9taXNlIHN0YWNrXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyBwcm9taXNlRXhlY3V0b3IoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICBpZiAoIXRoaXMucHJvbWlzZVJ1bm5pbmcpIHtcclxuICAgICAgd2hpbGUgKHRoaXMuc3RvcmVkUHJvbWlzZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIGlmICh0aGlzLm9yZGVyID09PSAnbm9ybWFsJykge1xyXG4gICAgICAgICAgdGhpcy5wcm9taXNlUnVubmluZyA9IHRoaXMuc3RvcmVkUHJvbWlzZXMuc2hpZnQoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMub3JkZXIgPT09ICdyZXZlcnNlJykge1xyXG4gICAgICAgICAgdGhpcy5wcm9taXNlUnVubmluZyA9IHRoaXMuc3RvcmVkUHJvbWlzZXMucG9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICBpZiAodGhpcy5wcm9taXNlUnVubmluZz8ucHJvbWlzZUZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIGF3YWl0IHRoaXMucHJvbWlzZVJ1bm5pbmcucHJvbWlzZUZ1bmN0aW9uKCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSBmaW5hbGx5IHtcclxuICAgICAgICAgIHRoaXMucHJvbWlzZVJ1bm5pbmcgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAaW5oZXJpdGRvY1xyXG4gICAqL1xyXG4gIHB1YmxpYyBhZGRQcm9taXNlKGtleTogSywgcHJvbWlzZUZ1bmN0aW9uOiBGdW5jdGlvblByb21pc2U8VD4pOiBQcm9taXNlPFQ+IHtcclxuICAgIGNvbnN0IHByb21pc2VPYmplY3Q6IFByb21pc2VJdGVtU3RhY2s8SywgVD4gPSB7IGtleSB9O1xyXG4gICAgY29uc3QgcHJvbWlzZSA9IG5ldyBQcm9taXNlPFQ+KChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgcHJvbWlzZU9iamVjdC5wcm9taXNlRnVuY3Rpb24gPSAoKSA9PiB7XHJcbiAgICAgICAgcmV0dXJuIHByb21pc2VGdW5jdGlvbigpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcclxuICAgICAgfTtcclxuICAgIH0pO1xyXG4gICAgcHJvbWlzZU9iamVjdC5wcm9taXNlID0gcHJvbWlzZTtcclxuICAgIHRoaXMuc3RvcmVkUHJvbWlzZXMucHVzaChwcm9taXNlT2JqZWN0KTtcclxuICAgIHRoaXMucHJvbWlzZUV4ZWN1dG9yKCk7XHJcblxyXG4gICAgcmV0dXJuIHByb21pc2U7XHJcbiAgfVxyXG59XHJcbiJdfQ==