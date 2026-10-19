"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaWebContent = void 0;

require("source-map-support/register");

var _updatableResource = require("../../../resources/updatable-resource");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @category Internal
 */
class SigaaWebContent extends _updatableResource.AbstractUpdatableResource {
  constructor(http, parser, options, updater) {
    super(options.instanceIndentifier, updater);
    this.http = http;
    this.parser = parser;

    _defineProperty(this, "type", 'webcontent');

    _defineProperty(this, "_title", void 0);

    _defineProperty(this, "form", void 0);

    _defineProperty(this, "_content", void 0);

    _defineProperty(this, "_date", void 0);

    this.update(options);
  }

  update(options) {
    this._title = options.title;
    if (options.date) this._date = options.date;
    this.form = options.form;
    this.isClosed = false;
  }

  async getDate() {
    if (!this._date) {
      await this.loadWebContentPage();
    }

    return this._date;
  }

  get title() {
    this.checkIfItWasClosed();
    return this._title;
  }

  async getContent() {
    if (!this._content) {
      await this.loadWebContentPage();
    }

    return this._content;
  }

  async loadWebContentPage(retry = true) {
    this.checkIfItWasClosed();

    try {
      const page = await this.http.post(this.form.action.href, this.form.postValues);

      if (page.statusCode === 200) {
        const rows = page.$('table.formAva tr').toArray();

        for (const row of rows) {
          const rowLabel = this.parser.removeTagsHtml(page.$(row).find('th').html());
          const rowContent = this.parser.removeTagsHtml(page.$(row).find('td').html());

          switch (rowLabel) {
            case 'Título:':
              {
                this._title = rowContent;
                break;
              }

            case 'Conteúdo:':
              {
                this._content = rowContent;
                break;
              }

            case 'Data Cadastro:':
              {
                const date = this.parser.parseDates(rowContent, 1);
                this._date = date[0];
                break;
              }
          }
        }
      } else if (page.statusCode === 302) {
        throw new Error('SIGAA: Webcontent expired.');
      } else {
        throw new Error('SIGAA: Unexpected webcontent page status code.');
      }
    } catch (err) {
      if (retry) {
        await this.updateInstance();
        return this.loadWebContentPage(false);
      } else {
        throw err;
      }
    }
  }

  get id() {
    this.checkIfItWasClosed();
    return this.form.postValues.id;
  }

}

exports.SigaaWebContent = SigaaWebContent;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3Vyc2VzL3Jlc291cmNlcy9hdHRhY2htZW50cy9zaWdhYS13ZWItY29udGVudC1zdHVkZW50LnRzIl0sIm5hbWVzIjpbIlNpZ2FhV2ViQ29udGVudCIsIkFic3RyYWN0VXBkYXRhYmxlUmVzb3VyY2UiLCJjb25zdHJ1Y3RvciIsImh0dHAiLCJwYXJzZXIiLCJvcHRpb25zIiwidXBkYXRlciIsImluc3RhbmNlSW5kZW50aWZpZXIiLCJ1cGRhdGUiLCJfdGl0bGUiLCJ0aXRsZSIsImRhdGUiLCJfZGF0ZSIsImZvcm0iLCJpc0Nsb3NlZCIsImdldERhdGUiLCJsb2FkV2ViQ29udGVudFBhZ2UiLCJjaGVja0lmSXRXYXNDbG9zZWQiLCJnZXRDb250ZW50IiwiX2NvbnRlbnQiLCJyZXRyeSIsInBhZ2UiLCJwb3N0IiwiYWN0aW9uIiwiaHJlZiIsInBvc3RWYWx1ZXMiLCJzdGF0dXNDb2RlIiwicm93cyIsIiQiLCJ0b0FycmF5Iiwicm93Iiwicm93TGFiZWwiLCJyZW1vdmVUYWdzSHRtbCIsImZpbmQiLCJodG1sIiwicm93Q29udGVudCIsInBhcnNlRGF0ZXMiLCJFcnJvciIsImVyciIsInVwZGF0ZUluc3RhbmNlIiwiaWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUtBOzs7O0FBMEJBO0FBQ0E7QUFDQTtBQUNPLE1BQU1BLGVBQU4sU0FDR0MsNENBREgsQ0FHUDtBQVFFQyxFQUFBQSxXQUFXLENBQ0RDLElBREMsRUFFREMsTUFGQyxFQUdUQyxPQUhTLEVBSVRDLE9BSlMsRUFLVDtBQUNBLFVBQU1ELE9BQU8sQ0FBQ0UsbUJBQWQsRUFBbUNELE9BQW5DO0FBREEsU0FKUUgsSUFJUixHQUpRQSxJQUlSO0FBQUEsU0FIUUMsTUFHUixHQUhRQSxNQUdSOztBQUFBLGtDQVpjLFlBWWQ7O0FBQUE7O0FBQUE7O0FBQUE7O0FBQUE7O0FBRUEsU0FBS0ksTUFBTCxDQUFZSCxPQUFaO0FBQ0Q7O0FBRURHLEVBQUFBLE1BQU0sQ0FBQ0gsT0FB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VixDQUFxQmUsRUFBNUI7QUFDRDs7QUFoR0giLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQYXJzZXIgfSBmcm9tICdAaGVscGVycy9zaWdhYS1wYXJzZXInO1xyXG5pbXBvcnQgeyBVcGRhdGFibGVSZXNvdXJjZURhdGEgfSBmcm9tICdAcmVzb3VyY2VzL3NpZ2FhLXJlc291cmNlLW1hbmFnZXInO1xyXG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnQHNlc3Npb24vc2lnYWEtaHR0cCc7XHJcbmltcG9ydCB7IFNpZ2FhRm9ybSB9IGZyb20gJ0BzZXNzaW9uL3NpZ2FhLXBhZ2UnO1xyXG5cclxuaW1wb3J0IHtcclxuICBBYnN0cmFjdFVwZGF0YWJsZVJlc291cmNlLFxyXG4gIFVwZGF0YWJsZVJlc291cmNlLFxyXG4gIFVwZGF0YWJsZVJlc291cmNlQ2FsbGJhY2tcclxufSBmcm9tICdAcmVzb3VyY2VzL3VwZGF0YWJsZS1yZXNvdXJjZSc7XHJcblxyXG4vKipcclxuICogQGNhdGVnb3J5IEludGVybmFsXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdlYkNvbnRlbnREYXRhIGV4dGVuZHMgVXBkYXRhYmxlUmVzb3VyY2VEYXRhIHtcclxuICB0aXRsZTogc3RyaW5nO1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgZm9ybTogU2lnYWFGb3JtO1xyXG4gIGRhdGU/OiBEYXRlO1xyXG59XHJcblxyXG4vKipcclxuICogQGNhdGVnb3J5IEludGVybmFsXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFdlYkNvbnRlbnQgZXh0ZW5kcyBVcGRhdGFibGVSZXNvdXJjZTxXZWJDb250ZW50RGF0YT4ge1xyXG4gIHJlYWRvbmx5IHR5cGU6ICd3ZWJjb250ZW50JztcclxuXHJcbiAgZ2V0RGF0ZSgpOiBQcm9taXNlPERhdGU+O1xyXG4gIGdldENvbnRlbnQoKTogUHJvbWlzZTxzdHJpbmc+O1xyXG4gIHJlYWRvbmx5IHRpdGxlOiBzdHJpbmc7XHJcbn1cclxuLyoqXHJcbiAqIEBjYXRlZ29yeSBJbnRlcm5hbFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFNpZ2FhV2ViQ29udGVudFxyXG4gIGV4dGVuZHMgQWJzdHJhY3RVcGRhdGFibGVSZXNvdXJjZVxyXG4gIGltcGxlbWVudHMgV2ViQ29udGVudFxyXG57XHJcbiAgcmVhZG9ubHkgdHlwZSA9ICd3ZWJjb250ZW50JztcclxuXHJcbiAgcHJpdmF0ZSBfdGl0bGUhOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSBmb3JtITogU2lnYWFGb3JtO1xyXG4gIHByaXZhdGUgX2NvbnRlbnQhOiBzdHJpbmc7XHJcbiAgcHJpdmF0ZSBfZGF0ZSE6IERhdGU7XHJcblxyXG4gIGNvbnN0cnVjdG9yKFxyXG4gICAgcHJpdmF0ZSBodHRwOiBIVFRQLFxyXG4gICAgcHJpdmF0ZSBwYXJzZXI6IFBhcnNlcixcclxuICAgIG9wdGlvbnM6IFdlYkNvbnRlbnREYXRhLFxyXG4gICAgdXBkYXRlcjogVXBkYXRhYmxlUmVzb3VyY2VDYWxsYmFja1xyXG4gICkge1xyXG4gICAgc3VwZXIob3B0aW9ucy5pbnN0YW5jZUluZGVudGlmaWVyLCB1cGRhdGVyKTtcclxuICAgIHRoaXMudXBkYXRlKG9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlKG9wdGlvbnM6IFdlYkNvbnRlbnREYXRhKTogdm9pZCB7XHJcbiAgICB0aGlzLl90aXRsZSA9IG9wdGlvbnMudGl0bGU7XHJcbiAgICBpZiAob3B0aW9ucy5kYXRlKSB0aGlzLl9kYXRlID0gb3B0aW9ucy5kYXRlO1xyXG4gICAgdGhpcy5mb3JtID0gb3B0aW9ucy5mb3JtO1xyXG4gICAgdGhpcy5pc0Nsb3NlZCA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgYXN5bmMgZ2V0RGF0ZSgpOiBQcm9taXNlPERhdGU+IHtcclxuICAgIGlmICghdGhpcy5fZGF0ZSkge1xyXG4gICAgICBhd2FpdCB0aGlzLmxvYWRXZWJDb250ZW50UGFnZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2RhdGU7XHJcbiAgfVxyXG5cclxuICBnZXQgdGl0bGUoKTogc3RyaW5nIHtcclxuICAgIHRoaXMuY2hlY2tJZkl0V2FzQ2xvc2VkKCk7XHJcbiAgICByZXR1cm4gdGhpcy5fdGl0bGU7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXRDb250ZW50KCk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICBpZiAoIXRoaXMuX2NvbnRlbnQpIHtcclxuICAgICAgYXdhaXQgdGhpcy5sb2FkV2ViQ29udGVudFBhZ2UoKTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9jb250ZW50O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBsb2FkV2ViQ29udGVudFBhZ2UocmV0cnkgPSB0cnVlKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICB0aGlzLmNoZWNrSWZJdFdhc0Nsb3NlZCgpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuaHR0cC5wb3N0KFxyXG4gICAgICAgIHRoaXMuZm9ybS5hY3Rpb24uaHJlZixcclxuICAgICAgICB0aGlzLmZvcm0ucG9zdFZhbHVlc1xyXG4gICAgICApO1xyXG4gICAgICBpZiAocGFnZS5zdGF0dXNDb2RlID09PSAyMDApIHtcclxuICAgICAgICBjb25zdCByb3dzID0gcGFnZS4kKCd0YWJsZS5mb3JtQXZhIHRyJykudG9BcnJheSgpO1xyXG4gICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcclxuICAgICAgICAgIGNvbnN0IHJvd0xhYmVsID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXHJcbiAgICAgICAgICAgIHBhZ2UuJChyb3cpLmZpbmQoJ3RoJykuaHRtbCgpXHJcbiAgICAgICAgICApO1xyXG4gICAgICAgICAgY29uc3Qgcm93Q29udGVudCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxyXG4gICAgICAgICAgICBwYWdlLiQocm93KS5maW5kKCd0ZCcpLmh0bWwoKVxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIHN3aXRjaCAocm93TGFiZWwpIHtcclxuICAgICAgICAgICAgY2FzZSAnVMOtdHVsbzonOiB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fdGl0bGUgPSByb3dDb250ZW50O1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhc2UgJ0NvbnRlw7pkbzonOiB7XHJcbiAgICAgICAgICAgICAgdGhpcy5fY29udGVudCA9IHJvd0NvbnRlbnQ7XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2FzZSAnRGF0YSBDYWRhc3RybzonOiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgZGF0ZSA9IHRoaXMucGFyc2VyLnBhcnNlRGF0ZXMocm93Q29udGVudCwgMSk7XHJcblxyXG4gICAgICAgICAgICAgIHRoaXMuX2RhdGUgPSBkYXRlWzBdO1xyXG5cclxuICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBlbHNlIGlmIChwYWdlLnN0YXR1c0NvZGUgPT09IDMwMikge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFdlYmNvbnRlbnQgZXhwaXJlZC4nKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBVbmV4cGVjdGVkIHdlYmNvbnRlbnQgcGFnZSBzdGF0dXMgY29kZS4nKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmIChyZXRyeSkge1xyXG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5zdGFuY2UoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5sb2FkV2ViQ29udGVudFBhZ2UoZmFsc2UpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IGVycjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgZ2V0IGlkKCk6IHN0cmluZyB7XHJcbiAgICB0aGlzLmNoZWNrSWZJdFdhc0Nsb3NlZCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuZm9ybS5wb3N0VmFsdWVzLmlkO1xyXG4gIH1cclxufVxyXG4iXX0=