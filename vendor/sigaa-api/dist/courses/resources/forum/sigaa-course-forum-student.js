"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaCourseForum = void 0;

require("source-map-support/register");

var _url = require("url");

var _formdataNode = require("formdata-node");

var _updatableResource = require("../../../resources/updatable-resource");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @category Internal
 */
class SigaaCourseForum extends _updatableResource.AbstractUpdatableResource {
  /**
   * Type of instance
   */

  /**
   * Form with parameters and url to load the forum page.
   */

  /**
   * Title of the forum.
   */

  /**
   * Number of topics
   */

  /**
   * Forum creator.
   */

  /**
   * Like 'Uma única discussão simples'
   */

  /**
   * Description of the forum.
   */

  /**
   * Form to submit topics in the forum.
   */

  /**
   * File attached to the forum.
   */

  /**
   * the forum id.
   */

  /**
   * If read monitoring is enabled.
   */

  /**
   *
   */

  /**
   * creation date of the forum.
   */
  constructor(http, parser, courseResourcesFactory, forumOptions, updater) {
    super(forumOptions.instanceIndentifier, updater);
    this.http = http;
    this.parser = parser;
    this.courseResourcesFactory = courseResourcesFactory;

    _defineProperty(this, "type", 'forum');

    _defineProperty(this, "_form", void 0);

    _defineProperty(this, "_title", void 0);

    _defineProperty(this, "_numOfTopics", void 0);

    _defineProperty(this, "_author", void 0);

    _defineProperty(this, "_forumType", void 0);

    _defineProperty(this, "_description", void 0);

    _defineProperty(this, "_submitTopicPageForm", void 0);

    _defineProperty(this, "_file", void 0);

    _defineProperty(this, "_id", void 0);

    _defineProperty(this, "_flagMonitorReading", void 0);

    _defineProperty(this, "_fullForumPromise", null);

    _defineProperty(this, "_creationDate", void 0);

    this.update(forumOptions);
  }

  update(forumOptions) {
    this._title = forumOptions.title;
    this._form = forumOptions.form;
    this._id = forumOptions.id;

    if (forumOptions.forumType !== undefined) {
      this._forumType = forumOptions.forumType;
    }

    if (forumOptions.numOfTopics !== undefined) {
      this._numOfTopics = forumOptions.numOfTopics;
    }

    if (forumOptions.author !== undefined) {
      this._author = forumOptions.author;
    }
  }
  /**
   * Loads the forum page.
   * @param retry
   */


  async getForumPage(retry = true) {
    try {
      const page = await this.http.post(this._form.action.href, this._form.postValues);
      this.parseForumTable(page);
      this.parseSubmitPageForm(page);
    } catch (err) {
      if (retry) {
        await this.updateInstance();
        return this.getForumPage(false);
      } else {
        throw err;
      }
    }
  }
  /**
   * Parse submit form in forum page.
   * @param page
   */


  parseSubmitPageForm(page) {
    const formElement = page.$('form#form');
    const action = formElement.attr('action');
    if (!action) throw new Error('SIGAA: Forum submit page has form without action.');
    const actionURL = new _url.URL(action, page.url.href);
    const postValues = {};
    formElement.find("input:not([type='button'])").each((index, element) => {
      const name = page.$(element).attr('name');
      if (name) postValues[name] = page.$(element).val();
    });
    this._submitTopicPageForm = {
      action: actionURL,
      postValues
    };
  }
  /**
   * Parse main page of forum.
   * @param page
   */


  parseForumTable(page) {
    const tableElement = page.$('table.formAva > tbody');
    if (tableElement.length === 0) throw new Error('SIGAA: Unexpected forum page without table element.');
    const rows = tableElement.find('tr').toArray();

    for (const row of rows) {
      const headCellElement = page.$(row).find('th');
      const dataCellElement = page.$(row).find('td');
      const label = this.parser.removeTagsHtml(headCellElement.html());
      const content = this.parser.removeTagsHtml(dataCellElement.html());

      switch (label) {
        case 'Título:':
          {
            this._title = content;
            break;
          }

        case 'Descrição:':
          {
            this._description = content;
            break;
          }

        case 'Autor(a):':
          {
            this._author = content;
            break;
          }

        case 'Arquivo:':
          {
            const linkElement = page.$(dataCellElement).find('a');

            if (linkElement.length === 1) {
              const title = this.parser.removeTagsHtml(linkElement.html());
              const onClick = linkElement.attr('onclick');
              if (!onClick) throw new Error('SIGAA: Invalid file format at forum page.');
              const form = page.parseJSFCLJS(onClick);
              const fileObj = {
                title,
                description: '',
                form,
                id: form.postValues.id,
                instanceIndentifier: form.postValues.id
              };

              if (this._file) {
                this._file.update(fileObj);
              } else {
                this._file = this.courseResourcesFactory.createFileFromFileData(fileObj, this.http, async () => {
                  await this.getForumPage();
                });
              }
            } else {
              this._file = undefined;
            }

            break;
          }

        case 'Monitorar Leitura:':
          {
            if (content === 'SIM') {
              this._flagMonitorReading = true;
            } else {
              this._flagMonitorReading = false;
            }

            break;
          }

        case 'Tipo:':
          {
            this._forumType = content;
            break;
          }

        case 'Ordenação Padrão:':
          {
            //TODO
            break;
          }

        case 'Criado em:':
          {
            const dates = this.parser.parseDates(content, 1);
            this._creationDate = dates[0];
            break;
          }

        default:
          {
            console.log('WARNING:forum label not recognized:' + label);
          }
      }
    }
  }

  async loadForumPage() {
    if (!this._fullForumPromise) {
      this._fullForumPromise = this.getForumPage();

      this._fullForumPromise.finally(() => {
        this._fullForumPromise = null;
      });
    }

    return this._fullForumPromise;
  }

  get title() {
    this.checkIfItWasClosed();
    return this._title;
  }
  /**
   * Like 'Uma única discussão simples'
   */


  async getForumType() {
    this.checkIfItWasClosed();

    if (this._forumType === undefined) {
      await this.loadForumPage();
    }

    if (!this._forumType) throw new Error('SIGAA: Forum type could not be loaded.');
    return this._forumType;
  }

  async getDescription() {
    this.checkIfItWasClosed();

    if (this._description === undefined) {
      await this.loadForumPage();
    }

    if (!this._description) throw new Error('SIGAA: Forum description could not be loaded.');
    return this._description;
  }
  /**
   * Post author
   */


  async getAuthor() {
    this.checkIfItWasClosed();

    if (this._author === undefined) {
      await this.loadForumPage();
    }

    if (!this._author) throw new Error('SIGAA: Forum author could not be loaded.');
    return this._author;
  }
  /**
   * If notifications are enabled
   */


  async getFlagMonitorReading() {
    this.checkIfItWasClosed();

    if (this._flagMonitorReading === undefined) {
      await this.loadForumPage();
    }

    if (!this._flagMonitorReading) throw new Error('SIGAA: Forum monitor reading flag could not be loaded.');
    return this._flagMonitorReading;
  }
  /**
   * creation date of the forum.
   */


  async getCreationDate() {
    this.checkIfItWasClosed();

    if (this._creationDate === undefined) {
      await this.loadForumPage();
    }

    if (!this._creationDate) throw new Error('SIGAA: Forum creation date could not be loaded.');
    return this._creationDate;
  }
  /**
   * File attached to the forum.
   */


  async getFile() {
    this.checkIfItWasClosed();

    if (this._file === undefined) {
      await this.loadForumPage();
    }

    return this._file;
  }
  /**
   * Number of topics
   */


  async getNumOfTopics() {
    this.checkIfItWasClosed();

    if (this._numOfTopics === undefined) {
      await this.updateInstance();
    }

    if (!this._numOfTopics) throw new Error('SIGAA: Forum number of topics could not be loaded.');
    return this._numOfTopics;
  }

  get id() {
    this.checkIfItWasClosed();
    return this._id;
  }
  /**
   * Post topic in forum
   * @param title title of topic
   * @param body body of topic
   * @param file buffer of file attachment
   * @param notify if notify members
   */


  async postTopic(title, body, file, notify) {
    if (!title) {
      throw new Error('SIGAA: Title topic forum cannot be empty.');
    }

    if (!body) {
      throw new Error('SIGAA: Title body forum cannot be empty.');
    }

    if (!this._submitTopicPageForm) {
      await this.loadForumPage();
    }

    if (!this._submitTopicPageForm) throw new Error('SIGAA: Could not get the forum form.');
    const page = await this.http.post(this._submitTopicPageForm.action.href, this._submitTopicPageForm.postValues);
    const formElement = page.$('form#form');
    const action = formElement.attr('action');
    if (!action) throw new Error('SIGAA: Forum post page has form without action.');
    const actionURl = new _url.URL(action, page.url.href);
    const inputHiddens = formElement.find('form#form input[type="hidden"]').toArray();
    const fileInput = formElement.find('input[type="file"]');
    const submitButton = formElement.find('input[name="form:btnSalvar"]');
    const notifyCheckbox = formElement.find('input[type="checkbox"]');
    if (inputHiddens.length === 0 || submitButton.length !== 1 || notifyCheckbox.length !== 1 || fileInput.length !== 1) throw new Error('SIGAA: Forum post page format is different than expected.');
    const formData = new _formdataNode.FormData();

    for (const input of inputHiddens) {
      const name = page.$(input).attr('name');
      if (name) formData.set(name, page.$(input).val());
    }

    if (file) {
      const name = fileInput.attr('name');
      if (!name) throw new Error('SIGAA: Forum post page has input file without name.');
      formData.set(name, file);
    }

    if (notify) {
      const name = notifyCheckbox.attr('name');
      if (!name) throw new Error('SIGAA: Forum post page has notify checkbox without name.');
      formData.set(name, 'on');
    }

    formData.set('form:assunto', title);
    formData.set('form:mensagem', body);
    const sumbitName = page.$(submitButton).attr('name');
    if (!sumbitName) throw new Error('SIGAA: Forum post page has submit button without name.');
    formData.set(sumbitName, page.$(submitButton).val());
    const responsePage = await this.http.postMultipart(actionURl.href, formData);

    if (!responsePage.bodyDecoded.includes('Operação realizada com sucesso!')) {
      throw new Error('SIGAA: Unexpected response forum post page.');
    }
  }

  *getTopics() {
    let stillHaveTopics = true;

    while (stillHaveTopics) {
      yield (async () => {
        stillHaveTopics = false;
        return true;
      })();
    }
  }

}

exports.SigaaCourseForum = SigaaCourseForum;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jb3Vyc2VzL3Jlc291cmNlcy9mb3J1bS9zaWdhYS1jb3Vyc2UtZm9ydW0tc3R1ZGVudC50cyJdLCJuYW1lcyI6WyJTaWdhYUNvdXJzZUZvcnVtIiwiQWJzdHJhY3RVcGRhdGFibGVSZXNvdXJjZSIsImNvbnN0cnVjdG9yIiwiaHR0cCIsInBhcnNlciIsImNvdXJzZVJlc291cmNlc0ZhY3RvcnkiLCJmb3J1bU9wdGlvbnMiLCJ1cGRhdGVyIiwiaW5zdGFuY2VJbmRlbnRpZmllciIsInVwZGF0ZSIsIl90aXRsZSIsInRpdGxlIiwiX2Zvcm0iLCJmb3JtIiwiX2lkIiwiaWQiLCJmb3J1bVR5cGUiLCJ1bmRlZmluZWQiLCJfZm9ydW1UeXBlIiwibnVtT2ZUb3BpY3MiLCJfbnVtT2ZUb3BpY3MiLCJhdXRob3IiLCJfYXV0aG9yIiwiZ2V0Rm9ydW1QYWdlIiwicmV0cnkiLCJwYWdlIiwicG9zdCIsImFjdGlvbiIsImhyZWYiLCJwb3N0VmFsdWVzIiwicGFyc2VGb3J1bVRhYmxlIiwicGFyc2VTdWJtaXRQYWdlRm9ybSIsImVyciIsInVwZGF0ZUluc3RhbmNlIiwiZm9ybUVsZW1lbnQiLCIkIiwiYXR0ciIsIkVycm9yIiwiYWN0aW9uVVJMIiwiVVJMIiwidXJsIiwiZmluZCIsImVhY2giLCJpbmRleCIsImVsZW1lbnQiLCJuYW1lIiwidmFsIiwiX3N1Ym1pdFRvcGljUGFnZUZvcm0iLCJ0YWJsZUVsZW1lbnQiLCJsZW5ndGgiLCJyb3dzIiwidG9BcnJheSIsInJvdyIsImhlYWRDZWxsRWxlbWVudCIsImRhdGFDZWxsRWxlbWVudCIsImxhYmVsIiwicmVtb3ZlVGFnc0h0bWwiLCJodG1sIiwiY29udGVudCIsIl9kZXNjcmlwdGlvbiIsImxpbmtFbGVtZW50Iiwib25DbGljayIsInBhcnNlSlNGQ0xKUyIsImZpbGVPYmoiLCJkZXNjcmlwdGlvbiIsIl9maWxlIiwiY3JlYXRlRmlsZUZyb21GaWxlRGF0YSIsIl9mbGFnTW9uaXRvclJlYWRpbmciLCJkYXRlcyIsInBhcnNlRGF0ZXMiLCJfY3JlYXRpb25EYXRlIiwiY29uc29sZSIsImxvZyIsImxvYWRGb3J1bVBhZ2UiLCJfZnVsbEZvcnVtUHJvbWlzZSIsImZpbmFsbHkiLCJjaGVja0lmSXRXYXNDbG9zZWQiLCJnZXRGb3J1bVR5cGUiLCJnZXREZXNjcmlwdGlvbiIsImdldEF1dGhvciIsImdldEZsYWdNb25pdG9yUmVhZGluZyIsImdldENyZWF0aW9uRGF0ZSIsImdldEZpbGUiLCJnZXROdW1PZlRvcGljcyIsInBvc3RUb3BpYyIsImJvZHkiLCJmaWxlIiwibm90aWZ5IiwiYWN0aW9uVVJsIiwiaW5wdXRIaWRkZW5zIiwiZmlsZUlucHV0Iiwic3VibWl0QnV0dG9uIiwibm90aWZ5Q2hlY2tib3giLCJmb3JtRGF0YSIsIkZvcm1EYXRhIiwiaW5wdXQiLCJzZXQiLCJzdW1iaXROYW1lIiwicmVzcG9uc2VQYWdlIiwicG9zdE11bHRpcGFydCIsImJvZHlEZWNvZGVkIiwiaW5jbHVkZXMiLCJnZXRUb3BpY3MiLCJzdGlsbEhhdmVUb3BpY3MiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBOztBQUNBOztBQUdBOzs7O0FBc0dBO0FBQ0E7QUFDQTtBQUNPLE1BQU1BLGdCQUFOLFNBQ0dDLDRDQURILENBR1A7QUFDRTtBQUNGO0FBQ0E7O0FBR0U7QUFDRjtBQUNBOztBQUdFO0FBQ0Y7QUFDQTs7QUFHRTtBQUNGO0FBQ0E7O0FBR0U7QUFDRjtBQUNBOztBQUdFO0FBQ0Y7QUFDQTs7QUFHRTtBQUNGO0FBQ0E7O0FBR0U7QUFDRjtBQUNBOztBQUdFO0FBQ0Y7QUFDQTs7QUFHRTtBQUNGO0FBQ0E7O0FBRUU7QUFDRjtBQUNBOztBQUdFO0FBQ0Y7QUFDQTs7QUFHRTtBQUNGO0FBQ0E7QUFHRUMsRUFBQUEsV0FBVyxDQUNEQyxJQURDLEVBRURDLE1BRkMsRUFHREMsc0JBSEMsRUFJVEMsWUFKUyxFQUtUQyxPQUxTLEVBTVQ7QUFDQSxVQUFNRCxZQUFZLENBQUNFLG1CQUFuQixFQUF3Q0QsT0FBeEM7QUFE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RixJQUFMLENBQVVnRyxhQUFWLENBQ3pCWCxTQUFTLENBQUM1RCxJQURlLEVBRXpCaUUsUUFGeUIsQ0FBM0I7O0FBSUEsUUFBSSxDQUFDSyxZQUFZLENBQUNFLFdBQWIsQ0FBeUJDLFFBQXpCLENBQWtDLGlDQUFsQyxDQUFMLEVBQTJFO0FBQ3pFLFlBQU0sSUFBSWhFLEtBQUosQ0FBVSw2Q0FBVixDQUFOO0FBQ0Q7QUFDRjs7QUFFUyxHQUFUaUUsU0FBUyxHQUE0QztBQUNwRCxRQUFJQyxlQUFlLEdBQUcsSUFBdEI7O0FBQ0EsV0FBT0EsZUFBUCxFQUF3QjtBQUN0QixZQUFNLENBQUMsWUFBOEI7QUFDbkNBLFFBQUFBLGVBQWUsR0FBRyxLQUFsQjtBQUNBLGVBQU8sSUFBUDtBQUNELE9BSEssR0FBTjtBQUlEO0FBQ0Y7O0FBemFIIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVVJMIH0gZnJvbSAndXJsJztcclxuaW1wb3J0IHsgRm9ybURhdGEgfSBmcm9tICdmb3JtZGF0YS1ub2RlJztcclxuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSAnQGhlbHBlcnMvc2lnYWEtcGFyc2VyJztcclxuaW1wb3J0IHsgRmlsZSwgRmlsZURhdGEgfSBmcm9tICdAcmVzb3VyY2VzL3NpZ2FhLWZpbGUnO1xyXG5pbXBvcnQge1xyXG4gIEFic3RyYWN0VXBkYXRhYmxlUmVzb3VyY2UsXHJcbiAgVXBkYXRhYmxlUmVzb3VyY2UsXHJcbiAgVXBkYXRhYmxlUmVzb3VyY2VDYWxsYmFja1xyXG59IGZyb20gJ0ByZXNvdXJjZXMvdXBkYXRhYmxlLXJlc291cmNlJztcclxuaW1wb3J0IHsgSFRUUCB9IGZyb20gJ0BzZXNzaW9uL3NpZ2FhLWh0dHAnO1xyXG5pbXBvcnQgeyBTaWdhYUZvcm0sIFBhZ2UgfSBmcm9tICdAc2Vzc2lvbi9zaWdhYS1wYWdlJztcclxuaW1wb3J0IHsgQ291cnNlUmVzb3VyY2VzRmFjdG9yeSB9IGZyb20gJ0Bjb3Vyc2VzL3NpZ2FhLWNvdXJzZS1yZXNvdXJjZXMtZmFjdG9yeSc7XHJcbmltcG9ydCB7IFVwZGF0YWJsZVJlc291cmNlRGF0YSB9IGZyb20gJ0ByZXNvdXJjZXMvc2lnYWEtcmVzb3VyY2UtbWFuYWdlcic7XHJcblxyXG4vKipcclxuICogT2JqZWN0IHRoYXQgY29udGFpbnMgYmFzaWMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIGNsYXNzIGZvcnVtLlxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgRm9ydW1EYXRhIGV4dGVuZHMgVXBkYXRhYmxlUmVzb3VyY2VEYXRhIHtcclxuICAvKipcclxuICAgKiBUaXRsZSBvZiB0aGUgZm9ydW0uXHJcbiAgICovXHJcbiAgdGl0bGU6IHN0cmluZztcclxuXHJcbiAgLyoqXHJcbiAgICogSWQgb2YgdGhlIGZvcnVtLiBUaGlzIGlzIHVuaXF1ZVxyXG4gICAqL1xyXG4gIGlkOiBzdHJpbmc7XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcm0gd2l0aCBwYXJhbWV0ZXJzIGFuZCB1cmwgdG8gbG9hZCB0aGUgZm9ydW0gcGFnZS5cclxuICAgKi9cclxuICBmb3JtOiBTaWdhYUZvcm07XHJcblxyXG4gIC8qKlxyXG4gICAqIGNyZWF0aW9uIGRhdGUgb2YgdGhlIGZvcnVtLlxyXG4gICAqL1xyXG4gIGNyZWF0aW9uRGF0ZT86IERhdGU7XHJcblxyXG4gIC8qKlxyXG4gICAqIExpa2UgJ1VtYSDDum5pY2EgZGlzY3Vzc8OjbyBzaW1wbGVzJ1xyXG4gICAqL1xyXG4gIGZvcnVtVHlwZT86IHN0cmluZztcclxuXHJcbiAgLyoqXHJcbiAgICogRm9ydW0gY3JlYXRvci5cclxuICAgKi9cclxuICBhdXRob3I/OiBzdHJpbmc7XHJcblxyXG4gIC8qKlxyXG4gICAqIE51bWJlciBvZiB0b3BpY3NcclxuICAgKi9cclxuICBudW1PZlRvcGljcz86IG51bWJlcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBjYXRlZ29yeSBQdWJsaWNcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ291cnNlRm9ydW0gZXh0ZW5kcyBVcGRhdGFibGVSZXNvdXJjZTxGb3J1bURhdGE+IHtcclxuICByZWFkb25seSB0eXBlOiAnZm9ydW0nO1xyXG5cclxuICAvKipcclxuICAgKiBJZiByZWFkIG1vbml0b3JpbmcgaXMgZW5hYmxlZC5cclxuICAgKi9cclxuICBnZXRGbGFnTW9uaXRvclJlYWRpbmcoKTogUHJvbWlzZTxib29sZWFuPjtcclxuXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHRvcGljc1xyXG4gICAqL1xyXG4gIGdldE51bU9mVG9waWNzKCk6IFByb21pc2U8bnVtYmVyPjtcclxuXHJcbiAgLyoqXHJcbiAgICogUG9zdCB0b3BpYyBpbiBmb3J1bVxyXG4gICAqIEBwYXJhbSB0aXRsZSB0aXRsZSBvZiB0b3BpY1xyXG4gICAqIEBwYXJhbSBib2R5IGJvZHkgb2YgdG9waWNcclxuICAgKiBAcGFyYW0gZmlsZSBidWZmZXIgb2YgZmlsZSBhdHRhY2htZW50XHJcbiAgICogQHBhcmFtIG5vdGlmeSBpZiBub3RpZnkgbWVtYmVyc1xyXG4gICAqL1xyXG4gIHBvc3RUb3BpYyhcclxuICAgIHRpdGxlOiBzdHJpbmcsXHJcbiAgICBib2R5OiBzdHJpbmcsXHJcbiAgICBmaWxlOiBzdHJpbmcsXHJcbiAgICBub3RpZnk6IGJvb2xlYW5cclxuICApOiBQcm9taXNlPHZvaWQ+O1xyXG5cclxuICAvKipcclxuICAgKiBQb3N0IGF1dGhvclxyXG4gICAqL1xyXG4gIGdldEF1dGhvcigpOiBQcm9taXNlPHN0cmluZz47XHJcbiAgLyoqXHJcbiAgICogRmlsZSBhdHRhY2hlZCB0byB0aGUgZm9ydW0uXHJcbiAgICovXHJcbiAgZ2V0RmlsZSgpOiBQcm9taXNlPEZpbGUgfCB1bmRlZmluZWQ+O1xyXG4gIC8qKlxyXG4gICAqIExpa2UgJ1VtYSDDum5pY2EgZGlzY3Vzc8OjbyBzaW1wbGVzJ1xyXG4gICAqL1xyXG4gIGdldEZvcnVtVHlwZSgpOiBQcm9taXNlPHN0cmluZz47XHJcblxyXG4gIHJlYWRvbmx5IHRpdGxlOiBzdHJpbmc7XHJcblxyXG4gIC8qKlxyXG4gICAqIGNyZWF0aW9uIGRhdGUgb2YgdGhlIGZvcnVtLlxyXG4gICAqL1xyXG4gIGdldENyZWF0aW9uRGF0ZSgpOiBQcm9taXNlPERhdGU+O1xyXG59XHJcblxyXG4vKipcclxuICogQGNhdGVnb3J5IEludGVybmFsXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU2lnYWFDb3Vyc2VGb3J1bVxyXG4gIGV4dGVuZHMgQWJzdHJhY3RVcGRhdGFibGVSZXNvdXJjZVxyXG4gIGltcGxlbWVudHMgQ291cnNlRm9ydW1cclxue1xyXG4gIC8qKlxyXG4gICAqIFR5cGUgb2YgaW5zdGFuY2VcclxuICAgKi9cclxuICByZWFkb25seSB0eXBlID0gJ2ZvcnVtJztcclxuXHJcbiAgLyoqXHJcbiAgICogRm9ybSB3aXRoIHBhcmFtZXRlcnMgYW5kIHVybCB0byBsb2FkIHRoZSBmb3J1bSBwYWdlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2Zvcm0hOiBTaWdhYUZvcm07XHJcblxyXG4gIC8qKlxyXG4gICAqIFRpdGxlIG9mIHRoZSBmb3J1bS5cclxuICAgKi9cclxuICBwcml2YXRlIF90aXRsZSE6IHN0cmluZztcclxuXHJcbiAgLyoqXHJcbiAgICogTnVtYmVyIG9mIHRvcGljc1xyXG4gICAqL1xyXG4gIHByaXZhdGUgX251bU9mVG9waWNzPzogbnVtYmVyO1xyXG5cclxuICAvKipcclxuICAgKiBGb3J1bSBjcmVhdG9yLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2F1dGhvcj86IHN0cmluZztcclxuXHJcbiAgLyoqXHJcbiAgICogTGlrZSAnVW1hIMO6bmljYSBkaXNjdXNzw6NvIHNpbXBsZXMnXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfZm9ydW1UeXBlPzogc3RyaW5nO1xyXG5cclxuICAvKipcclxuICAgKiBEZXNjcmlwdGlvbiBvZiB0aGUgZm9ydW0uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfZGVzY3JpcHRpb24/OiBzdHJpbmc7XHJcblxyXG4gIC8qKlxyXG4gICAqIEZvcm0gdG8gc3VibWl0IHRvcGljcyBpbiB0aGUgZm9ydW0uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfc3VibWl0VG9waWNQYWdlRm9ybT86IFNpZ2FhRm9ybTtcclxuXHJcbiAgLyoqXHJcbiAgICogRmlsZSBhdHRhY2hlZCB0byB0aGUgZm9ydW0uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfZmlsZT86IEZpbGU7XHJcblxyXG4gIC8qKlxyXG4gICAqIHRoZSBmb3J1bSBpZC5cclxuICAgKi9cclxuICBwcml2YXRlIF9pZCE6IHN0cmluZztcclxuICAvKipcclxuICAgKiBJZiByZWFkIG1vbml0b3JpbmcgaXMgZW5hYmxlZC5cclxuICAgKi9cclxuICBwcml2YXRlIF9mbGFnTW9uaXRvclJlYWRpbmc/OiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKlxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2Z1bGxGb3J1bVByb21pc2U6IFByb21pc2U8dm9pZD4gfCBudWxsID0gbnVsbDtcclxuXHJcbiAgLyoqXHJcbiAgICogY3JlYXRpb24gZGF0ZSBvZiB0aGUgZm9ydW0uXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBfY3JlYXRpb25EYXRlPzogRGF0ZTtcclxuXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIGh0dHA6IEhUVFAsXHJcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyLFxyXG4gICAgcHJpdmF0ZSBjb3Vyc2VSZXNvdXJjZXNGYWN0b3J5OiBDb3Vyc2VSZXNvdXJjZXNGYWN0b3J5LFxyXG4gICAgZm9ydW1PcHRpb25zOiBGb3J1bURhdGEsXHJcbiAgICB1cGRhdGVyOiBVcGRhdGFibGVSZXNvdXJjZUNhbGxiYWNrXHJcbiAgKSB7XHJcbiAgICBzdXBlcihmb3J1bU9wdGlvbnMuaW5zdGFuY2VJbmRlbnRpZmllciwgdXBkYXRlcik7XHJcbiAgICB0aGlzLnVwZGF0ZShmb3J1bU9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgdXBkYXRlKGZvcnVtT3B0aW9uczogRm9ydW1EYXRhKTogdm9pZCB7XHJcbiAgICB0aGlzLl90aXRsZSA9IGZvcnVtT3B0aW9ucy50aXRsZTtcclxuICAgIHRoaXMuX2Zvcm0gPSBmb3J1bU9wdGlvbnMuZm9ybTtcclxuICAgIHRoaXMuX2lkID0gZm9ydW1PcHRpb25zLmlkO1xyXG5cclxuICAgIGlmIChmb3J1bU9wdGlvbnMuZm9ydW1UeXBlICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5fZm9ydW1UeXBlID0gZm9ydW1PcHRpb25zLmZvcnVtVHlwZTtcclxuICAgIH1cclxuICAgIGlmIChmb3J1bU9wdGlvbnMubnVtT2ZUb3BpY3MgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICB0aGlzLl9udW1PZlRvcGljcyA9IGZvcnVtT3B0aW9ucy5udW1PZlRvcGljcztcclxuICAgIH1cclxuICAgIGlmIChmb3J1bU9wdGlvbnMuYXV0aG9yICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgdGhpcy5fYXV0aG9yID0gZm9ydW1PcHRpb25zLmF1dGhvcjtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIExvYWRzIHRoZSBmb3J1bSBwYWdlLlxyXG4gICAqIEBwYXJhbSByZXRyeVxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXN5bmMgZ2V0Rm9ydW1QYWdlKHJldHJ5ID0gdHJ1ZSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuaHR0cC5wb3N0KFxyXG4gICAgICAgIHRoaXMuX2Zvcm0uYWN0aW9uLmhyZWYsXHJcbiAgICAgICAgdGhpcy5fZm9ybS5wb3N0VmFsdWVzXHJcbiAgICAgICk7XHJcblxyXG4gICAgICB0aGlzLnBhcnNlRm9ydW1UYWJsZShwYWdlKTtcclxuICAgICAgdGhpcy5wYXJzZVN1Ym1pdFBhZ2VGb3JtKHBhZ2UpO1xyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmIChyZXRyeSkge1xyXG4gICAgICAgIGF3YWl0IHRoaXMudXBkYXRlSW5zdGFuY2UoKTtcclxuICAgICAgICByZXR1cm4gdGhpcy5nZXRGb3J1bVBhZ2UoZmFsc2UpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IGVycjtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICAvKipcclxuICAgKiBQYXJzZSBzdWJtaXQgZm9ybSBpbiBmb3J1bSBwYWdlLlxyXG4gICAqIEBwYXJhbSBwYWdlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwYXJzZVN1Ym1pdFBhZ2VGb3JtKHBhZ2U6IFBhZ2UpOiB2b2lkIHtcclxuICAgIGNvbnN0IGZvcm1FbGVtZW50ID0gcGFnZS4kKCdmb3JtI2Zvcm0nKTtcclxuICAgIGNvbnN0IGFjdGlvbiA9IGZvcm1FbGVtZW50LmF0dHIoJ2FjdGlvbicpO1xyXG4gICAgaWYgKCFhY3Rpb24pXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEZvcnVtIHN1Ym1pdCBwYWdlIGhhcyBmb3JtIHdpdGhvdXQgYWN0aW9uLicpO1xyXG4gICAgY29uc3QgYWN0aW9uVVJMID0gbmV3IFVSTChhY3Rpb24sIHBhZ2UudXJsLmhyZWYpO1xyXG4gICAgY29uc3QgcG9zdFZhbHVlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xyXG4gICAgZm9ybUVsZW1lbnRcclxuICAgICAgLmZpbmQoXCJpbnB1dDpub3QoW3R5cGU9J2J1dHRvbiddKVwiKVxyXG4gICAgICAuZWFjaCgoaW5kZXg6IG51bWJlciwgZWxlbWVudDogY2hlZXJpby5FbGVtZW50KSA9PiB7XHJcbiAgICAgICAgY29uc3QgbmFtZSA9IHBhZ2UuJChlbGVtZW50KS5hdHRyKCduYW1lJyk7XHJcbiAgICAgICAgaWYgKG5hbWUpIHBvc3RWYWx1ZXNbbmFtZV0gPSBwYWdlLiQoZWxlbWVudCkudmFsKCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIHRoaXMuX3N1Ym1pdFRvcGljUGFnZUZvcm0gPSB7XHJcbiAgICAgIGFjdGlvbjogYWN0aW9uVVJMLFxyXG4gICAgICBwb3N0VmFsdWVzXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUGFyc2UgbWFpbiBwYWdlIG9mIGZvcnVtLlxyXG4gICAqIEBwYXJhbSBwYWdlXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwYXJzZUZvcnVtVGFibGUocGFnZTogUGFnZSk6IHZvaWQge1xyXG4gICAgY29uc3QgdGFibGVFbGVtZW50ID0gcGFnZS4kKCd0YWJsZS5mb3JtQXZhID4gdGJvZHknKTtcclxuICAgIGlmICh0YWJsZUVsZW1lbnQubGVuZ3RoID09PSAwKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBVbmV4cGVjdGVkIGZvcnVtIHBhZ2Ugd2l0aG91dCB0YWJsZSBlbGVtZW50LicpO1xyXG5cclxuICAgIGNvbnN0IHJvd3MgPSB0YWJsZUVsZW1lbnQuZmluZCgndHInKS50b0FycmF5KCk7XHJcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XHJcbiAgICAgIGNvbnN0IGhlYWRDZWxsRWxlbWVudCA9IHBhZ2UuJChyb3cpLmZpbmQoJ3RoJyk7XHJcbiAgICAgIGNvbnN0IGRhdGFDZWxsRWxlbWVudCA9IHBhZ2UuJChyb3cpLmZpbmQoJ3RkJyk7XHJcbiAgICAgIGNvbnN0IGxhYmVsID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoaGVhZENlbGxFbGVtZW50Lmh0bWwoKSk7XHJcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChkYXRhQ2VsbEVsZW1lbnQuaHRtbCgpKTtcclxuICAgICAgc3dpdGNoIChsYWJlbCkge1xyXG4gICAgICAgIGNhc2UgJ1TDrXR1bG86Jzoge1xyXG4gICAgICAgICAgdGhpcy5fdGl0bGUgPSBjb250ZW50O1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ0Rlc2NyacOnw6NvOic6IHtcclxuICAgICAgICAgIHRoaXMuX2Rlc2NyaXB0aW9uID0gY29udGVudDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlICdBdXRvcihhKTonOiB7XHJcbiAgICAgICAgICB0aGlzLl9hdXRob3IgPSBjb250ZW50O1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ0FycXVpdm86Jzoge1xyXG4gICAgICAgICAgY29uc3QgbGlua0VsZW1lbnQgPSBwYWdlLiQoZGF0YUNlbGxFbGVtZW50KS5maW5kKCdhJyk7XHJcbiAgICAgICAgICBpZiAobGlua0VsZW1lbnQubGVuZ3RoID09PSAxKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRpdGxlID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwobGlua0VsZW1lbnQuaHRtbCgpKTtcclxuICAgICAgICAgICAgY29uc3Qgb25DbGljayA9IGxpbmtFbGVtZW50LmF0dHIoJ29uY2xpY2snKTtcclxuICAgICAgICAgICAgaWYgKCFvbkNsaWNrKVxyXG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEludmFsaWQgZmlsZSBmb3JtYXQgYXQgZm9ydW0gcGFnZS4nKTtcclxuICAgICAgICAgICAgY29uc3QgZm9ybSA9IHBhZ2UucGFyc2VKU0ZDTEpTKG9uQ2xpY2spO1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlT2JqOiBGaWxlRGF0YSA9IHtcclxuICAgICAgICAgICAgICB0aXRsZSxcclxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJycsXHJcbiAgICAgICAgICAgICAgZm9ybSxcclxuICAgICAgICAgICAgICBpZDogZm9ybS5wb3N0VmFsdWVzLmlkLFxyXG4gICAgICAgICAgICAgIGluc3RhbmNlSW5kZW50aWZpZXI6IGZvcm0ucG9zdFZhbHVlcy5pZFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fZmlsZSkge1xyXG4gICAgICAgICAgICAgIHRoaXMuX2ZpbGUudXBkYXRlKGZpbGVPYmopO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIHRoaXMuX2ZpbGUgPSB0aGlzLmNvdXJzZVJlc291cmNlc0ZhY3RvcnkuY3JlYXRlRmlsZUZyb21GaWxlRGF0YShcclxuICAgICAgICAgICAgICAgIGZpbGVPYmosXHJcbiAgICAgICAgICAgICAgICB0aGlzLmh0dHAsXHJcbiAgICAgICAgICAgICAgICBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0Rm9ydW1QYWdlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fZmlsZSA9IHVuZGVmaW5lZDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlICdNb25pdG9yYXIgTGVpdHVyYTonOiB7XHJcbiAgICAgICAgICBpZiAoY29udGVudCA9PT0gJ1NJTScpIHtcclxuICAgICAgICAgICAgdGhpcy5fZmxhZ01vbml0b3JSZWFkaW5nID0gdHJ1ZTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2ZsYWdNb25pdG9yUmVhZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ1RpcG86Jzoge1xyXG4gICAgICAgICAgdGhpcy5fZm9ydW1UeXBlID0gY29udGVudDtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlICdPcmRlbmHDp8OjbyBQYWRyw6NvOic6IHtcclxuICAgICAgICAgIC8vVE9ET1xyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgJ0NyaWFkbyBlbTonOiB7XHJcbiAgICAgICAgICBjb25zdCBkYXRlcyA9IHRoaXMucGFyc2VyLnBhcnNlRGF0ZXMoY29udGVudCwgMSk7XHJcbiAgICAgICAgICB0aGlzLl9jcmVhdGlvbkRhdGUgPSBkYXRlc1swXTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBkZWZhdWx0OiB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnV0FSTklORzpmb3J1bSBsYWJlbCBub3QgcmVjb2duaXplZDonICsgbGFiZWwpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSBhc3luYyBsb2FkRm9ydW1QYWdlKCkge1xyXG4gICAgaWYgKCF0aGlzLl9mdWxsRm9ydW1Qcm9taXNlKSB7XHJcbiAgICAgIHRoaXMuX2Z1bGxGb3J1bVByb21pc2UgPSB0aGlzLmdldEZvcnVtUGFnZSgpO1xyXG4gICAgICB0aGlzLl9mdWxsRm9ydW1Qcm9taXNlLmZpbmFsbHkoKCkgPT4ge1xyXG4gICAgICAgIHRoaXMuX2Z1bGxGb3J1bVByb21pc2UgPSBudWxsO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIHJldHVybiB0aGlzLl9mdWxsRm9ydW1Qcm9taXNlO1xyXG4gIH1cclxuXHJcbiAgZ2V0IHRpdGxlKCk6IHN0cmluZyB7XHJcbiAgICB0aGlzLmNoZWNrSWZJdFdhc0Nsb3NlZCgpO1xyXG4gICAgcmV0dXJuIHRoaXMuX3RpdGxlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogTGlrZSAnVW1hIMO6bmljYSBkaXNjdXNzw6NvIHNpbXBsZXMnXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0Rm9ydW1UeXBlKCk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICB0aGlzLmNoZWNrSWZJdFdhc0Nsb3NlZCgpO1xyXG4gICAgaWYgKHRoaXMuX2ZvcnVtVHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IHRoaXMubG9hZEZvcnVtUGFnZSgpO1xyXG4gICAgfVxyXG4gICAgaWYgKCF0aGlzLl9mb3J1bVR5cGUpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEZvcnVtIHR5cGUgY291bGQgbm90IGJlIGxvYWRlZC4nKTtcclxuICAgIHJldHVybiB0aGlzLl9mb3J1bVR5cGU7XHJcbiAgfVxyXG5cclxuICBhc3luYyBnZXREZXNjcmlwdGlvbigpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgdGhpcy5jaGVja0lmSXRXYXNDbG9zZWQoKTtcclxuICAgIGlmICh0aGlzLl9kZXNjcmlwdGlvbiA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IHRoaXMubG9hZEZvcnVtUGFnZSgpO1xyXG4gICAgfVxyXG4gICAgaWYgKCF0aGlzLl9kZXNjcmlwdGlvbilcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogRm9ydW0gZGVzY3JpcHRpb24gY291bGQgbm90IGJlIGxvYWRlZC4nKTtcclxuICAgIHJldHVybiB0aGlzLl9kZXNjcmlwdGlvbjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBvc3QgYXV0aG9yXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0QXV0aG9yKCk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICB0aGlzLmNoZWNrSWZJdFdhc0Nsb3NlZCgpO1xyXG4gICAgaWYgKHRoaXMuX2F1dGhvciA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IHRoaXMubG9hZEZvcnVtUGFnZSgpO1xyXG4gICAgfVxyXG4gICAgaWYgKCF0aGlzLl9hdXRob3IpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEZvcnVtIGF1dGhvciBjb3VsZCBub3QgYmUgbG9hZGVkLicpO1xyXG4gICAgcmV0dXJuIHRoaXMuX2F1dGhvcjtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIElmIG5vdGlmaWNhdGlvbnMgYXJlIGVuYWJsZWRcclxuICAgKi9cclxuICBhc3luYyBnZXRGbGFnTW9uaXRvclJlYWRpbmcoKTogUHJvbWlzZTxib29sZWFuPiB7XHJcbiAgICB0aGlzLmNoZWNrSWZJdFdhc0Nsb3NlZCgpO1xyXG4gICAgaWYgKHRoaXMuX2ZsYWdNb25pdG9yUmVhZGluZyA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IHRoaXMubG9hZEZvcnVtUGFnZSgpO1xyXG4gICAgfVxyXG4gICAgaWYgKCF0aGlzLl9mbGFnTW9uaXRvclJlYWRpbmcpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEZvcnVtIG1vbml0b3IgcmVhZGluZyBmbGFnIGNvdWxkIG5vdCBiZSBsb2FkZWQuJyk7XHJcbiAgICByZXR1cm4gdGhpcy5fZmxhZ01vbml0b3JSZWFkaW5nO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogY3JlYXRpb24gZGF0ZSBvZiB0aGUgZm9ydW0uXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0Q3JlYXRpb25EYXRlKCk6IFByb21pc2U8RGF0ZT4ge1xyXG4gICAgdGhpcy5jaGVja0lmSXRXYXNDbG9zZWQoKTtcclxuICAgIGlmICh0aGlzLl9jcmVhdGlvbkRhdGUgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhd2FpdCB0aGlzLmxvYWRGb3J1bVBhZ2UoKTtcclxuICAgIH1cclxuICAgIGlmICghdGhpcy5fY3JlYXRpb25EYXRlKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBGb3J1bSBjcmVhdGlvbiBkYXRlIGNvdWxkIG5vdCBiZSBsb2FkZWQuJyk7XHJcbiAgICByZXR1cm4gdGhpcy5fY3JlYXRpb25EYXRlO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRmlsZSBhdHRhY2hlZCB0byB0aGUgZm9ydW0uXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0RmlsZSgpOiBQcm9taXNlPEZpbGUgfCB1bmRlZmluZWQ+IHtcclxuICAgIHRoaXMuY2hlY2tJZkl0V2FzQ2xvc2VkKCk7XHJcbiAgICBpZiAodGhpcy5fZmlsZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGF3YWl0IHRoaXMubG9hZEZvcnVtUGFnZSgpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIHRoaXMuX2ZpbGU7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBOdW1iZXIgb2YgdG9waWNzXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0TnVtT2ZUb3BpY3MoKTogUHJvbWlzZTxudW1iZXI+IHtcclxuICAgIHRoaXMuY2hlY2tJZkl0V2FzQ2xvc2VkKCk7XHJcbiAgICBpZiAodGhpcy5fbnVtT2ZUb3BpY3MgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBhd2FpdCB0aGlzLnVwZGF0ZUluc3RhbmNlKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIXRoaXMuX251bU9mVG9waWNzKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBGb3J1bSBudW1iZXIgb2YgdG9waWNzIGNvdWxkIG5vdCBiZSBsb2FkZWQuJyk7XHJcbiAgICByZXR1cm4gdGhpcy5fbnVtT2ZUb3BpY3M7XHJcbiAgfVxyXG5cclxuICBnZXQgaWQoKTogc3RyaW5nIHtcclxuICAgIHRoaXMuY2hlY2tJZkl0V2FzQ2xvc2VkKCk7XHJcbiAgICByZXR1cm4gdGhpcy5faWQ7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQb3N0IHRvcGljIGluIGZvcnVtXHJcbiAgICogQHBhcmFtIHRpdGxlIHRpdGxlIG9mIHRvcGljXHJcbiAgICogQHBhcmFtIGJvZHkgYm9keSBvZiB0b3BpY1xyXG4gICAqIEBwYXJhbSBmaWxlIGJ1ZmZlciBvZiBmaWxlIGF0dGFjaG1lbnRcclxuICAgKiBAcGFyYW0gbm90aWZ5IGlmIG5vdGlmeSBtZW1iZXJzXHJcbiAgICovXHJcbiAgYXN5bmMgcG9zdFRvcGljKFxyXG4gICAgdGl0bGU6IHN0cmluZyxcclxuICAgIGJvZHk6IHN0cmluZyxcclxuICAgIGZpbGU6IHN0cmluZyxcclxuICAgIG5vdGlmeTogYm9vbGVhblxyXG4gICk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgaWYgKCF0aXRsZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBUaXRsZSB0b3BpYyBmb3J1bSBjYW5ub3QgYmUgZW1wdHkuJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoIWJvZHkpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogVGl0bGUgYm9keSBmb3J1bSBjYW5ub3QgYmUgZW1wdHkuJyk7XHJcbiAgICB9XHJcbiAgICBpZiAoIXRoaXMuX3N1Ym1pdFRvcGljUGFnZUZvcm0pIHtcclxuICAgICAgYXdhaXQgdGhpcy5sb2FkRm9ydW1QYWdlKCk7XHJcbiAgICB9XHJcbiAgICBpZiAoIXRoaXMuX3N1Ym1pdFRvcGljUGFnZUZvcm0pXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IENvdWxkIG5vdCBnZXQgdGhlIGZvcnVtIGZvcm0uJyk7XHJcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5odHRwLnBvc3QoXHJcbiAgICAgIHRoaXMuX3N1Ym1pdFRvcGljUGFnZUZvcm0uYWN0aW9uLmhyZWYsXHJcbiAgICAgIHRoaXMuX3N1Ym1pdFRvcGljUGFnZUZvcm0ucG9zdFZhbHVlc1xyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBmb3JtRWxlbWVudCA9IHBhZ2UuJCgnZm9ybSNmb3JtJyk7XHJcbiAgICBjb25zdCBhY3Rpb24gPSBmb3JtRWxlbWVudC5hdHRyKCdhY3Rpb24nKTtcclxuICAgIGlmICghYWN0aW9uKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBGb3J1bSBwb3N0IHBhZ2UgaGFzIGZvcm0gd2l0aG91dCBhY3Rpb24uJyk7XHJcbiAgICBjb25zdCBhY3Rpb25VUmwgPSBuZXcgVVJMKGFjdGlvbiwgcGFnZS51cmwuaHJlZik7XHJcblxyXG4gICAgY29uc3QgaW5wdXRIaWRkZW5zID0gZm9ybUVsZW1lbnRcclxuICAgICAgLmZpbmQoJ2Zvcm0jZm9ybSBpbnB1dFt0eXBlPVwiaGlkZGVuXCJdJylcclxuICAgICAgLnRvQXJyYXkoKTtcclxuICAgIGNvbnN0IGZpbGVJbnB1dCA9IGZvcm1FbGVtZW50LmZpbmQoJ2lucHV0W3R5cGU9XCJmaWxlXCJdJyk7XHJcbiAgICBjb25zdCBzdWJtaXRCdXR0b24gPSBmb3JtRWxlbWVudC5maW5kKCdpbnB1dFtuYW1lPVwiZm9ybTpidG5TYWx2YXJcIl0nKTtcclxuICAgIGNvbnN0IG5vdGlmeUNoZWNrYm94ID0gZm9ybUVsZW1lbnQuZmluZCgnaW5wdXRbdHlwZT1cImNoZWNrYm94XCJdJyk7XHJcbiAgICBpZiAoXHJcbiAgICAgIGlucHV0SGlkZGVucy5sZW5ndGggPT09IDAgfHxcclxuICAgICAgc3VibWl0QnV0dG9uLmxlbmd0aCAhPT0gMSB8fFxyXG4gICAgICBub3RpZnlDaGVja2JveC5sZW5ndGggIT09IDEgfHxcclxuICAgICAgZmlsZUlucHV0Lmxlbmd0aCAhPT0gMVxyXG4gICAgKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgJ1NJR0FBOiBGb3J1bSBwb3N0IHBhZ2UgZm9ybWF0IGlzIGRpZmZlcmVudCB0aGFuIGV4cGVjdGVkLidcclxuICAgICAgKTtcclxuXHJcbiAgICBjb25zdCBmb3JtRGF0YSA9IG5ldyBGb3JtRGF0YSgpO1xyXG4gICAgZm9yIChjb25zdCBpbnB1dCBvZiBpbnB1dEhpZGRlbnMpIHtcclxuICAgICAgY29uc3QgbmFtZSA9IHBhZ2UuJChpbnB1dCkuYXR0cignbmFtZScpO1xyXG4gICAgICBpZiAobmFtZSkgZm9ybURhdGEuc2V0KG5hbWUsIHBhZ2UuJChpbnB1dCkudmFsKCkpO1xyXG4gICAgfVxyXG4gICAgaWYgKGZpbGUpIHtcclxuICAgICAgY29uc3QgbmFtZSA9IGZpbGVJbnB1dC5hdHRyKCduYW1lJyk7XHJcbiAgICAgIGlmICghbmFtZSlcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBGb3J1bSBwb3N0IHBhZ2UgaGFzIGlucHV0IGZpbGUgd2l0aG91dCBuYW1lLicpO1xyXG4gICAgICBmb3JtRGF0YS5zZXQobmFtZSwgZmlsZSk7XHJcbiAgICB9XHJcbiAgICBpZiAobm90aWZ5KSB7XHJcbiAgICAgIGNvbnN0IG5hbWUgPSBub3RpZnlDaGVja2JveC5hdHRyKCduYW1lJyk7XHJcbiAgICAgIGlmICghbmFtZSlcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgICAnU0lHQUE6IEZvcnVtIHBvc3QgcGFnZSBoYXMgbm90aWZ5IGNoZWNrYm94IHdpdGhvdXQgbmFtZS4nXHJcbiAgICAgICAgKTtcclxuICAgICAgZm9ybURhdGEuc2V0KG5hbWUsICdvbicpO1xyXG4gICAgfVxyXG4gICAgZm9ybURhdGEuc2V0KCdmb3JtOmFzc3VudG8nLCB0aXRsZSk7XHJcbiAgICBmb3JtRGF0YS5zZXQoJ2Zvcm06bWVuc2FnZW0nLCBib2R5KTtcclxuICAgIGNvbnN0IHN1bWJpdE5hbWUgPSBwYWdlLiQoc3VibWl0QnV0dG9uKS5hdHRyKCduYW1lJyk7XHJcbiAgICBpZiAoIXN1bWJpdE5hbWUpXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEZvcnVtIHBvc3QgcGFnZSBoYXMgc3VibWl0IGJ1dHRvbiB3aXRob3V0IG5hbWUuJyk7XHJcblxyXG4gICAgZm9ybURhdGEuc2V0KHN1bWJpdE5hbWUsIHBhZ2UuJChzdWJtaXRCdXR0b24pLnZhbCgpKTtcclxuICAgIGNvbnN0IHJlc3BvbnNlUGFnZSA9IGF3YWl0IHRoaXMuaHR0cC5wb3N0TXVsdGlwYXJ0KFxyXG4gICAgICBhY3Rpb25VUmwuaHJlZixcclxuICAgICAgZm9ybURhdGFcclxuICAgICk7XHJcbiAgICBpZiAoIXJlc3BvbnNlUGFnZS5ib2R5RGVjb2RlZC5pbmNsdWRlcygnT3BlcmHDp8OjbyByZWFsaXphZGEgY29tIHN1Y2Vzc28hJykpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogVW5leHBlY3RlZCByZXNwb25zZSBmb3J1bSBwb3N0IHBhZ2UuJyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAqZ2V0VG9waWNzKCk6IEdlbmVyYXRvcjxQcm9taXNlPGJvb2xlYW4+LCB2b2lkLCB2b2lkPiB7XHJcbiAgICBsZXQgc3RpbGxIYXZlVG9waWNzID0gdHJ1ZTtcclxuICAgIHdoaWxlIChzdGlsbEhhdmVUb3BpY3MpIHtcclxuICAgICAgeWllbGQgKGFzeW5jICgpOiBQcm9taXNlPGJvb2xlYW4+ID0+IHtcclxuICAgICAgICBzdGlsbEhhdmVUb3BpY3MgPSBmYWxzZTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfSkoKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19