"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaAccountIFSC = void 0;

require("source-map-support/register");

var _sigaaTypes = require("../sigaa-types");

var _url = require("url");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Responsible for representing the user account.
 * @category Internal
 */
class SigaaAccountIFSC {
  /**
   * @param homepage homepage (page after login) of user.
   */
  constructor(homepage, http, parser, session, bondFactory) {
    this.http = http;
    this.parser = parser;
    this.session = session;
    this.bondFactory = bondFactory;

    _defineProperty(this, "errorInvalidCredentials", 'SIGAA: Invalid credentials.');

    _defineProperty(this, "errorInsufficientPasswordComplexity", 'SIGAA: Insufficent password complexity.');

    _defineProperty(this, "_name", void 0);

    _defineProperty(this, "_emails", void 0);

    _defineProperty(this, "activeBonds", []);

    _defineProperty(this, "inactiveBonds", []);

    _defineProperty(this, "pagehomeParsePromise", void 0);

    this.parseHomepage(homepage);
  }
  /**
   * Error message when the new password chosen does not meet the security requirements of SIGAA.
   * It is thrown by the changePassword() method
   */


  /**
   * Parse login result page to fill the instance.
   *
   * @param homepage home page to parse.
   */
  parseHomepage(homepage) {
    //Since the login page can vary, we should check the type of page.
    if (homepage.bodyDecoded.includes('O sistema comportou-se de forma inesperada')) {
      throw new Error('SIGAA: Invalid homepage, the system behaved unexpectedly.');
    }

    if (homepage.url.href.includes('/portais/discente/discente.jsf')) {
      //If it is home page student of desktop version.
      this.pagehomeParsePromise = this.parseStudentHomePage(homepage);
    } else if (homepage.url.href.includes('/sigaa/vinculos.jsf') || homepage.url.href.includes('/sigaa/escolhaVinculo.do')) {
      //If it is bond page.
      this.pagehomeParsePromise = this.parseBondPage(homepage);
    } else if (homepage.url.href.includes('/sigaa/telasPosSelecaoVinculos.jsf')) {
      this.pagehomeParsePromise = this.http.get(homepage.url.href, {
        noCache: true
      }).then(page => this.parseBondPage(page));
    } else {
      throw new Error('SIGAA: Unknown homepage format.');
    }
  }
  /**
   * Parse bond page.
   * @param page page to parse.
   */


  async parseBondPage(page) {
    const rows = page.$('table.subFormulario tbody tr').toArray();

    for (const row of rows) {
      const cells = page.$(row).find('td').toArray();
      if (cells.length === 0) continue;
      const bondType = this.parser.removeTagsHtml(page.$(row).find('#tdTipo').html());
      const status = this.parser.removeTagsHtml(page.$(cells[3]).html());
      let bond;

      switch (bondType) {
        case 'Discente':
          {
            const registration = this.parser.removeTagsHtml(page.$(cells[2]).html());
            const url = page.$(row).find('a[href]').attr('href');
            if (!url) throw new Error('SIGAA: Bond switch url could not be found.');
            const bondSwitchUrl = new _url.URL(url, page.url);
            const program = this.parser.removeTagsHtml(page.$(cells[4]).html()).replace(/^Curso: /g, '');
            bond = this.bondFactory.createStudentBond(registration, program, bondSwitchUrl);
            break;
          }

        case 'Docente':
          {
            bond = this.bondFactory.createTeacherBond();
            break;
          }
      }

      if (bond) if (status === 'Sim') {
        this.activeBonds.push(bond);
      } else if (status === 'Não') {
        this.inactiveBonds.push(bond);
      } else {
        console.log('SIGAA: WARNING invalid status: ' + status);
      }
    }
  }
  /**
   * @inheritdoc
   */


  async getActiveBonds() {
    await this.pagehomeParsePromise;
    return this.activeBonds;
  }
  /**
   * @inheritdoc
   */


  async getInactiveBonds() {
    await this.pagehomeParsePromise;
    return this.inactiveBonds;
  }
  /**
   * Parse desktop version of student home page page.
   */


  async parseStudentHomePage(homepage) {
    const rows = homepage.$('#perfil-docente table').eq(0).find('tr').toArray();
    let registration;
    let program;
    let status;
    const buttonSwitchBond = this.parser.removeTagsHtml(homepage.$('#info-usuario p i small a').html());

    if (buttonSwitchBond === 'Alterar vínculo') {
      const bondPage = await this.http.get('/sigaa/vinculos.jsf');
      return this.parseBondPage(bondPage);
    }

    for (const row of rows) {
      const cells = homepage.$(row).find('td');

      if (cells.length !== 2) {
        throw new Error('SIGAA: Invalid student details page.');
      }

      const rowName = this.parser.removeTagsHtml(cells.eq(0).html());

      switch (rowName) {
        case 'Matrícula:':
          registration = this.parser.removeTagsHtml(cells.eq(1).html());
          break;

        case 'Curso:':
          program = this.parser.removeTagsHtml(cells.eq(1).html()).replace(/ - (M|T|N)$/g, ''); // Remove schedule letter

          break;

        case 'Status:':
          status = this.parser.removeTagsHtml(cells.eq(1).html());
      }

      if (registration && program && status) break;
    }

    if (!registration) throw new Error('SIGAA: Student bond without registration code.');
    if (!program) throw new Error('SIGAA: Student bond program not found.');
    if (!status) throw new Error('SIGAA: Student bond status not found.');
    if (status === 'CURSANDO' || status === 'CONCLUINTE') this.activeBonds.push(this.bondFactory.createStudentBond(registration, program, null));else this.inactiveBonds.push(this.bondFactory.createStudentBond(registration, program, null));
  }
  /**
   * @inheritdoc
   */


  logoff() {
    return this.http.get('/sigaa/logar.do?dispatch=logOff').then(page => {
      return this.http.followAllRedirect(page);
    }).then(page => {
      if (page.statusCode !== 200) {
        throw new Error('SIGAA: Invalid status code in logoff page.');
      }

      this.session.loginStatus = _sigaaTypes.LoginStatus.Unauthenticated;
      this.http.closeSession();
    });
  }
  /**
   * Get profile picture URL.
   * @retuns Picture url or null if the user has no photo.
   */


  async getProfilePictureURL() {
    const page = await this.http.get('/sigaa/portais/discente/discente.jsf');
    const pictureElement = page.$('div[class="foto"] img');
    if (pictureElement.length === 0) return null;
    const pictureSrc = pictureElement.attr('src');
    if (!pictureSrc || pictureSrc.includes('/sigaa/img/no_picture.png')) return null;
    return new _url.URL(pictureSrc, page.url);
  }
  /**
   * Download profile url and save in basepath.
   * @param destpath It can be a folder or a file name, if it is a directory then it will be saved inside the folder, if it is a file name it will be saved exactly in this place, but if the folder does not exist it will throw an error.
   * @param callback To know the progress of the download, each downloaded part will be called informing how much has already been downloaded.
   * @retuns Full path of the downloaded file, useful if the destpath is a directory, or null if the user has no photo.
   */


  async downloadProfilePicture(destpath, callback) {
    const pictureURL = await this.getProfilePictureURL();
    if (!pictureURL) return null;
    return this.http.downloadFileByGet(pictureURL.href, destpath, callback);
  }
  /**
   * @inheritdoc
   */


  async getName() {
    if (this._name) return this._name;
    const page = await this.http.get('/sigaa/portais/discente/discente.jsf');

    if (page.statusCode === 200) {
      const username = this.parser.removeTagsHtml(page.$('p.usuario > span').html());
      this._name = username;
      return username;
    } else {
      throw new Error('SIGAA: Unexpected status code at student profile page.');
    }
  }
  /**
   * @inheritdoc
   */


  async getEmails() {
    if (this._emails) return this._emails;
    const page = await this.http.get('/sigaa/portais/discente/discente.jsf');

    if (page.statusCode === 200) {
      const buttons = page.$('#perfil-docente .pessoal-docente').find('a[onclick]').toArray();

      for (const button of buttons) {
        const buttonName = this.parser.removeTagsHtml(page.$(button).html());

        if (buttonName === 'Meus Dados Pessoais') {
          const buttonOnClick = page.$(button).attr('onclick');

          if (buttonOnClick) {
            const form = page.parseJSFCLJS(buttonOnClick);
            const myPersonalDataPage = await this.http.post(form.action.href, form.postValues);
            const rows = myPersonalDataPage.$('td[colspan="3"] table tbody tr').toArray();
            this._emails = [];

            for (const row of rows) {
              const email = this.parser.removeTagsHtml(page.$(row).html());

              this._emails.push(email);
            }
          }

          break;
        }
      }

      if (this._emails) return this._emails;
      return [];
    } else {
      throw new Error('SIGAA: Unexpected status code at student profile page.');
    }
  }
  /**
   * Change the password of account.
   * @param oldPassword current password.
   * @param newPassword new password.
   * @throws {errorInvalidCredentials} If current password is not correct.
   * @throws {errorInsufficientPasswordComplexity} If the new password does not have the complexity requirement.
   */


  async changePassword(oldPassword, newPassword) {
    const formPage = await this.http.get('/sigaa/alterar_dados.jsf');
    if (formPage.statusCode !== 302) throw new Error('SIGAA: Unexpected status code at change password form.');
    const prePage = await this.http.followAllRedirect(formPage);
    if (prePage.statusCode !== 200 || !prePage.url.href.includes('usuario/alterar_dados.jsf')) throw new Error('SIGAA: Invalid pre page at change password.');
    const preFormElement = prePage.$('form[name="form"]');
    const preAction = preFormElement.attr('action');
    if (!preAction) throw new Error('SIGAA: Form without action at change password pre page.');
    const preActionUrl = new _url.URL(preAction, prePage.url.href);
    const prePostValues = {};
    const preInputs = preFormElement.find("input[name]:not([type='submit'])").toArray();

    for (const input of preInputs) {
      const name = prePage.$(input).attr('name');

      if (name) {
        prePostValues[name] = prePage.$(input).val();
      }
    }

    prePostValues['form:alterarSenha'] = 'form:alterarSenha';
    const page = await this.http.post(preActionUrl.href, prePostValues);
    const formElement = page.$('form[name="form"]');
    const action = formElement.attr('action');
    if (!action) throw new Error('SIGAA: Form without action at change password page.');
    const formAction = new _url.URL(action, page.url.href);
    const postValues = {};
    const inputs = formElement.find("input[name]:not([type='submit'])").toArray();

    for (const input of inputs) {
      const name = page.$(input).attr('name');

      if (name) {
        postValues[name] = prePage.$(input).val();
      }
    }

    postValues['form:senhaAtual'] = oldPassword;
    postValues['form:novaSenha'] = newPassword;
    postValues['form:repetnNovaSenha'] = newPassword;
    postValues['form:alterarDados'] = 'Alterar Dados';
    const resultPage = await this.http.post(formAction.href, postValues);

    if (resultPage.statusCode === 200) {
      const errorMsg = this.parser.removeTagsHtml(resultPage.$('.erros li').html());

      if (errorMsg.includes('A senha digitada é muito simples.')) {
        throw new Error(this.errorInsufficientPasswordComplexity);
      }

      if (errorMsg.includes('Senha Atual digitada não confere')) {
        throw new Error(this.errorInvalidCredentials);
      }
    }

    if (resultPage.statusCode !== 302) {
      throw new Error('SIGAA: The change password page status code is different than expected.');
    }
  }

}

exports.SigaaAccountIFSC = SigaaAccountIFSC;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hY2NvdW50L3NpZ2FhLWFjY291bnQtaWZzYy50cyJdLCJuYW1lcyI6WyJTaWdhYUFjY291bnRJRlNDIiwiY29uc3RydWN0b3IiLCJob21lcGFnZSIsImh0dHAiLCJwYXJzZXIiLCJzZXNzaW9uIiwiYm9uZEZhY3RvcnkiLCJwYXJzZUhvbWVwYWdlIiwiYm9keURlY29kZWQiLCJpbmNsdWRlcyIsIkVycm9yIiwidXJsIiwiaHJlZiIsInBhZ2Vob21lUGFyc2VQcm9taXNlIiwicGFyc2VTdHVkZW50SG9tZVBhZ2UiLCJwYXJzZUJvbmRQYWdlIiwiZ2V0Iiwibm9DYWNoZSIsInRoZW4iLCJwYWdlIiwicm93cyIsIiQiLCJ0b0FycmF5Iiwicm93IiwiY2VsbHMiLCJmaW5kIiwibGVuZ3RoIiwiYm9uZFR5cGUiLCJyZW1vdmVUYWdzSHRtbCIsImh0bWwiLCJzdGF0dXMiLCJib25kIiwicmVnaXN0cmF0aW9uIiwiYXR0ciIsImJvbmRTd2l0Y2hVcmwiLCJVUkwiLCJwcm9ncmFtIiwicmVwbGFjZSIsImNyZWF0ZVN0dWRlbnRCb25kIiwiY3JlYXRlVGVhY2hlckJvbmQiLCJhY3RpdmVCb25kcyIsInB1c2giLCJpbmFjdGl2ZUJvbmRzIiwiY29uc29sZSIsImxvZyIsImdldEFjdGl2ZUJvbmRzIiwiZ2V0SW5hY3RpdmVCb25kcyIsImVxIiwiYnV0dG9uU3dpdGNoQm9uZCIsImJvbmRQYWdlIiwicm93TmFtZSIsImxvZ29mZiIsImZvbGxvd0FsbFJlZGlyZWN0Iiwic3RhdHVzQ29kZSIsImxvZ2luU3RhdHVzIiwiTG9naW5TdGF0dXMiLCJVbmF1dGhlbnRpY2F0ZWQiLCJjbG9zZVNlc3Npb24iLCJnZXRQcm9maWxlUGljdHVyZVVSTCIsInBpY3R1cmVFbGVtZW50IiwicGljdHVyZVNyYyIsImRvd25sb2FkUHJvZmlsZVBpY3R1cmUiLCJkZXN0cGF0aCIsImNhbGxiYWNrIiwicGljdHVyZVVSTCIsImRvd25sb2FkRmlsZUJ5R2V0IiwiZ2V0TmFtZSIsIl9uYW1lIiwidXNlcm5hbWUiLCJnZXRFbWFpbHMiLCJfZW1haWxzIiwiYnV0dG9ucyIsImJ1dHRvbiIsImJ1dHRvbk5hbWUiLCJidXR0b25PbkNsaWNrIiwiZm9ybSIsInBhcnNlSlNGQ0xKUyIsIm15UGVyc29uYWxEYXRhUGFnZSIsInBvc3QiLCJhY3Rpb24iLCJwb3N0VmFsdWVzIiwiZW1haWwiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJmb3JtUGFnZSIsInByZVBhZ2UiLCJwcmVGb3JtRWxlbWVudCIsInByZUFjdGlvbiIsInByZUFjdGlvblVybCIsInByZVBvc3RWYWx1ZXMiLCJwcmVJbnB1dHMiLCJpbnB1dCIsIm5hbWUiLCJ2YWwiLCJmb3JtRWxlbWVudCIsImZvcm1BY3Rpb24iLCJpbnB1dHMiLCJyZXN1bHRQYWdlIiwiZXJyb3JNc2ciLCJlcnJvckluc3VmZmljaWVudFBhc3N3b3JkQ29tcGxleGl0eSIsImVycm9ySW52YWxpZENyZWRlbnRpYWxzIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFHQTs7QUFJQTs7OztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTUEsZ0JBQU4sQ0FBMEM7QUFDL0M7QUFDRjtBQUNBO0FBQ0VDLEVBQUFBLFdBQVcsQ0FDVEMsUUFEUyxFQUVEQyxJQUZDLEVBR0RDLE1BSEMsRUFJREMsT0FKQyxFQUtEQyxXQUxDLEVBTVQ7QUFBQSxTQUpRSCxJQUlSLEdBSlFBLElBSVI7QUFBQSxTQUhRQyxNQUdSLEdBSFFBLE1BR1I7QUFBQSxTQUZRQyxPQUVSLEdBRlFBLE9BRVI7QUFBQSxTQURRQyxXQUNSLEdBRFFBLFdBQ1I7O0FBQUEscURBUWlDLDZCQVJqQzs7QUFBQSxpRUFlQSx5Q0FmQTs7QUFBQTs7QUFBQTs7QUFBQSx5Q0E4QmdDLEVBOUJoQzs7QUFBQSwyQ0FtQ2tDLEVBbkNsQzs7QUFBQTs7QUFDQSxTQUFLQyxhQUFMLENBQW1CTCxRQUFuQjtBQUNEO0FBRUQ7QUFDRjtBQUNBO0FBQ0E7OztBQW1DRTtBQUNGO0FB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VUFBVSxHQUFHLE1BQU0sS0FBSy9GLElBQUwsQ0FBVTJFLElBQVYsQ0FBZWtCLFVBQVUsQ0FBQ3BGLElBQTFCLEVBQWdDb0UsVUFBaEMsQ0FBekI7O0FBRUEsUUFBSWtCLFVBQVUsQ0FBQzdDLFVBQVgsS0FBMEIsR0FBOUIsRUFBbUM7QUFDakMsWUFBTThDLFFBQVEsR0FBRyxLQUFLL0YsTUFBTCxDQUFZd0IsY0FBWixDQUNmc0UsVUFBVSxDQUFDN0UsQ0FBWCxDQUFhLFdBQWIsRUFBMEJRLElBQTFCLEVBRGUsQ0FBakI7O0FBR0EsVUFBSXNFLFFBQVEsQ0FBQzFGLFFBQVQsQ0FBa0IsbUNBQWxCLENBQUosRUFBNEQ7QUFDMUQsY0FBTSxJQUFJQyxLQUFKLENBQVUsS0FBSzBGLG1DQUFmLENBQU47QUFDRDs7QUFDRCxVQUFJRCxRQUFRLENBQUMxRixRQUFULENBQWtCLGtDQUFsQixDQUFKLEVBQTJEO0FBQ3pELGNBQU0sSUFBSUMsS0FBSixDQUFVLEtBQUsyRix1QkFBZixDQUFOO0FBQ0Q7QUFDRjs7QUFFRCxRQUFJSCxVQUFVLENBQUM3QyxVQUFYLEtBQTBCLEdBQTlCLEVBQW1DO0FBQ2pDLFlBQU0sSUFBSTNDLEtBQUosQ0FDSix5RUFESSxDQUFOO0FBR0Q7QUFDRjs7QUFwWjhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSAnQGhlbHBlcnMvc2lnYWEtcGFyc2VyJztcclxuaW1wb3J0IHsgSFRUUCwgUHJvZ3Jlc3NDYWxsYmFjayB9IGZyb20gJ0BzZXNzaW9uL3NpZ2FhLWh0dHAnO1xyXG5pbXBvcnQgeyBTZXNzaW9uIH0gZnJvbSAnQHNlc3Npb24vc2lnYWEtc2Vzc2lvbic7XHJcbmltcG9ydCB7IExvZ2luU3RhdHVzIH0gZnJvbSAnLi4vc2lnYWEtdHlwZXMnO1xyXG5pbXBvcnQgeyBCb25kRmFjdG9yeSwgQm9uZFR5cGUgfSBmcm9tICdAYm9uZHMvc2lnYWEtYm9uZC1mYWN0b3J5JztcclxuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ0BzZXNzaW9uL3NpZ2FhLXBhZ2UnO1xyXG5pbXBvcnQgeyBBY2NvdW50IH0gZnJvbSAnLi9zaWdhYS1hY2NvdW50JztcclxuaW1wb3J0IHsgVVJMIH0gZnJvbSAndXJsJztcclxuXHJcbi8qKlxyXG4gKiBSZXNwb25zaWJsZSBmb3IgcmVwcmVzZW50aW5nIHRoZSB1c2VyIGFjY291bnQuXHJcbiAqIEBjYXRlZ29yeSBJbnRlcm5hbFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFNpZ2FhQWNjb3VudElGU0MgaW1wbGVtZW50cyBBY2NvdW50IHtcclxuICAvKipcclxuICAgKiBAcGFyYW0gaG9tZXBhZ2UgaG9tZXBhZ2UgKHBhZ2UgYWZ0ZXIgbG9naW4pIG9mIHVzZXIuXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBob21lcGFnZTogUGFnZSxcclxuICAgIHByaXZhdGUgaHR0cDogSFRUUCxcclxuICAgIHByaXZhdGUgcGFyc2VyOiBQYXJzZXIsXHJcbiAgICBwcml2YXRlIHNlc3Npb246IFNlc3Npb24sXHJcbiAgICBwcml2YXRlIGJvbmRGYWN0b3J5OiBCb25kRmFjdG9yeVxyXG4gICkge1xyXG4gICAgdGhpcy5wYXJzZUhvbWVwYWdlKGhvbWVwYWdlKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEVycm9yIG1lc3NhZ2Ugd2hlbiB0aGUgbmV3IHBhc3N3b3JkIGNob3NlbiBkb2VzIG5vdCBtZWV0IHRoZSBzZWN1cml0eSByZXF1aXJlbWVudHMgb2YgU0lHQUEuXHJcbiAgICogSXQgaXMgdGhyb3duIGJ5IHRoZSBjaGFuZ2VQYXNzd29yZCgpIG1ldGhvZFxyXG4gICAqL1xyXG4gIHJlYWRvbmx5IGVycm9ySW52YWxpZENyZWRlbnRpYWxzID0gJ1NJR0FBOiBJbnZhbGlkIGNyZWRlbnRpYWxzLic7XHJcblxyXG4gIC8qKlxyXG4gICAqIEVycm9yIG1lc3NhZ2Ugd2hlbiB0aGUgb2xkIHBhc3N3b3JkIGlzIG5vdCB0aGUgY3VycmVudCBwYXNzd29yZC5cclxuICAgKiBJdCBpcyB0aHJvd24gYnkgdGhlIGNoYW5nZVBhc3N3b3JkKCkgbWV0aG9kLlxyXG4gICAqL1xyXG4gIHJlYWRvbmx5IGVycm9ySW5zdWZmaWNpZW50UGFzc3dvcmRDb21wbGV4aXR5ID1cclxuICAgICdTSUdBQTogSW5zdWZmaWNlbnQgcGFzc3dvcmQgY29tcGxleGl0eS4nO1xyXG5cclxuICAvKipcclxuICAgKiBTdHVkZW50IG5hbWUgY2FjaGVcclxuICAgKi9cclxuICBwcml2YXRlIF9uYW1lPzogc3RyaW5nO1xyXG5cclxuICAvKipcclxuICAgKiBTdHVkZW50IGUtbWFpbCBjYWNoZVxyXG4gICAqL1xyXG4gIHByaXZhdGUgX2VtYWlscz86IHN0cmluZ1tdO1xyXG5cclxuICAvKipcclxuICAgKiBBcnJheSBvZiBhY3RpdmUgYm9uZHMuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhY3RpdmVCb25kczogQm9uZFR5cGVbXSA9IFtdO1xyXG5cclxuICAvKipcclxuICAgKiBBcnJheSBvZiBpbmFjdGl2ZSBib25kcy5cclxuICAgKi9cclxuICBwcml2YXRlIGluYWN0aXZlQm9uZHM6IEJvbmRUeXBlW10gPSBbXTtcclxuXHJcbiAgLyoqXHJcbiAgICogSXQgaXMgYSBwcm9taXNlIHRoYXQgc3RvcmVzIGlmIHRoZSBwYWdlIHBhcnNlciBoYXMgYWxyZWFkeSBjb21wbGV0ZWRcclxuICAgKi9cclxuICBwcml2YXRlIHBhZ2Vob21lUGFyc2VQcm9taXNlPzogUHJvbWlzZTx2b2lkPjtcclxuXHJcbiAgLyoqXHJcbiAgICogUGFyc2UgbG9naW4gcmVzdWx0IHBhZ2UgdG8gZmlsbCB0aGUgaW5zdGFuY2UuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gaG9tZXBhZ2UgaG9tZSBwYWdlIHRvIHBhcnNlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgcGFyc2VIb21lcGFnZShob21lcGFnZTogUGFnZSk6IHZvaWQge1xyXG4gICAgLy9TaW5jZSB0aGUgbG9naW4gcGFnZSBjYW4gdmFyeSwgd2Ugc2hvdWxkIGNoZWNrIHRoZSB0eXBlIG9mIHBhZ2UuXHJcbiAgICBpZiAoXHJcbiAgICAgIGhvbWVwYWdlLmJvZHlEZWNvZGVkLmluY2x1ZGVzKFxyXG4gICAgICAgICdPIHNpc3RlbWEgY29tcG9ydG91LXNlIGRlIGZvcm1hIGluZXNwZXJhZGEnXHJcbiAgICAgIClcclxuICAgICkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgJ1NJR0FBOiBJbnZhbGlkIGhvbWVwYWdlLCB0aGUgc3lzdGVtIGJlaGF2ZWQgdW5leHBlY3RlZGx5LidcclxuICAgICAgKTtcclxuICAgIH1cclxuICAgIGlmIChob21lcGFnZS51cmwuaHJlZi5pbmNsdWRlcygnL3BvcnRhaXMvZGlzY2VudGUvZGlzY2VudGUuanNmJykpIHtcclxuICAgICAgLy9JZiBpdCBpcyBob21lIHBhZ2Ugc3R1ZGVudCBvZiBkZXNrdG9wIHZlcnNpb24uXHJcbiAgICAgIHRoaXMucGFnZWhvbWVQYXJzZVByb21pc2UgPSB0aGlzLnBhcnNlU3R1ZGVudEhvbWVQYWdlKGhvbWVwYWdlKTtcclxuICAgIH0gZWxzZSBpZiAoXHJcbiAgICAgIGhvbWVwYWdlLnVybC5ocmVmLmluY2x1ZGVzKCcvc2lnYWEvdmluY3Vsb3MuanNmJykgfHxcclxuICAgICAgaG9tZXBhZ2UudXJsLmhyZWYuaW5jbHVkZXMoJy9zaWdhYS9lc2NvbGhhVmluY3Vsby5kbycpXHJcbiAgICApIHtcclxuICAgICAgLy9JZiBpdCBpcyBib25kIHBhZ2UuXHJcbiAgICAgIHRoaXMucGFnZWhvbWVQYXJzZVByb21pc2UgPSB0aGlzLnBhcnNlQm9uZFBhZ2UoaG9tZXBhZ2UpO1xyXG4gICAgfSBlbHNlIGlmIChcclxuICAgICAgaG9tZXBhZ2UudXJsLmhyZWYuaW5jbHVkZXMoJy9zaWdhYS90ZWxhc1Bvc1NlbGVjYW9WaW5jdWxvcy5qc2YnKVxyXG4gICAgKSB7XHJcbiAgICAgIHRoaXMucGFnZWhvbWVQYXJzZVByb21pc2UgPSB0aGlzLmh0dHBcclxuICAgICAgICAuZ2V0KGhvbWVwYWdlLnVybC5ocmVmLCB7IG5vQ2FjaGU6IHRydWUgfSlcclxuICAgICAgICAudGhlbigocGFnZSkgPT4gdGhpcy5wYXJzZUJvbmRQYWdlKHBhZ2UpKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFVua25vd24gaG9tZXBhZ2UgZm9ybWF0LicpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUGFyc2UgYm9uZCBwYWdlLlxyXG4gICAqIEBwYXJhbSBwYWdlIHBhZ2UgdG8gcGFyc2UuXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBhc3luYyBwYXJzZUJvbmRQYWdlKHBhZ2U6IFBhZ2UpIHtcclxuICAgIGNvbnN0IHJvd3MgPSBwYWdlLiQoJ3RhYmxlLnN1YkZvcm11bGFyaW8gdGJvZHkgdHInKS50b0FycmF5KCk7XHJcbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XHJcbiAgICAgIGNvbnN0IGNlbGxzID0gcGFnZS4kKHJvdykuZmluZCgndGQnKS50b0FycmF5KCk7XHJcbiAgICAgIGlmIChjZWxscy5sZW5ndGggPT09IDApIGNvbnRpbnVlO1xyXG5cclxuICAgICAgY29uc3QgYm9uZFR5cGUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcclxuICAgICAgICBwYWdlLiQocm93KS5maW5kKCcjdGRUaXBvJykuaHRtbCgpXHJcbiAgICAgICk7XHJcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJChjZWxsc1szXSkuaHRtbCgpKTtcclxuICAgICAgbGV0IGJvbmQ7XHJcbiAgICAgIHN3aXRjaCAoYm9uZFR5cGUpIHtcclxuICAgICAgICBjYXNlICdEaXNjZW50ZSc6IHtcclxuICAgICAgICAgIGNvbnN0IHJlZ2lzdHJhdGlvbiA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxyXG4gICAgICAgICAgICBwYWdlLiQoY2VsbHNbMl0pLmh0bWwoKVxyXG4gICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICBjb25zdCB1cmwgPSBwYWdlLiQocm93KS5maW5kKCdhW2hyZWZdJykuYXR0cignaHJlZicpO1xyXG4gICAgICAgICAgaWYgKCF1cmwpXHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEJvbmQgc3dpdGNoIHVybCBjb3VsZCBub3QgYmUgZm91bmQuJyk7XHJcbiAgICAgICAgICBjb25zdCBib25kU3dpdGNoVXJsID0gbmV3IFVSTCh1cmwsIHBhZ2UudXJsKTtcclxuXHJcbiAgICAgICAgICBjb25zdCBwcm9ncmFtID0gdGhpcy5wYXJzZXJcclxuICAgICAgICAgICAgLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJChjZWxsc1s0XSkuaHRtbCgpKVxyXG4gICAgICAgICAgICAucmVwbGFjZSgvXkN1cnNvOiAvZywgJycpO1xyXG4gICAgICAgICAgYm9uZCA9IHRoaXMuYm9uZEZhY3RvcnkuY3JlYXRlU3R1ZGVudEJvbmQoXHJcbiAgICAgICAgICAgIHJlZ2lzdHJhdGlvbixcclxuICAgICAgICAgICAgcHJvZ3JhbSxcclxuICAgICAgICAgICAgYm9uZFN3aXRjaFVybFxyXG4gICAgICAgICAgKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjYXNlICdEb2NlbnRlJzoge1xyXG4gICAgICAgICAgYm9uZCA9IHRoaXMuYm9uZEZhY3RvcnkuY3JlYXRlVGVhY2hlckJvbmQoKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBpZiAoYm9uZClcclxuICAgICAgICBpZiAoc3RhdHVzID09PSAnU2ltJykge1xyXG4gICAgICAgICAgdGhpcy5hY3RpdmVCb25kcy5wdXNoKGJvbmQpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdHVzID09PSAnTsOjbycpIHtcclxuICAgICAgICAgIHRoaXMuaW5hY3RpdmVCb25kcy5wdXNoKGJvbmQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjb25zb2xlLmxvZygnU0lHQUE6IFdBUk5JTkcgaW52YWxpZCBzdGF0dXM6ICcgKyBzdGF0dXMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBpbmhlcml0ZG9jXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0QWN0aXZlQm9uZHMoKTogUHJvbWlzZTxCb25kVHlwZVtdPiB7XHJcbiAgICBhd2FpdCB0aGlzLnBhZ2Vob21lUGFyc2VQcm9taXNlO1xyXG4gICAgcmV0dXJuIHRoaXMuYWN0aXZlQm9uZHM7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBAaW5oZXJpdGRvY1xyXG4gICAqL1xyXG4gIGFzeW5jIGdldEluYWN0aXZlQm9uZHMoKTogUHJvbWlzZTxCb25kVHlwZVtdPiB7XHJcbiAgICBhd2FpdCB0aGlzLnBhZ2Vob21lUGFyc2VQcm9taXNlO1xyXG4gICAgcmV0dXJuIHRoaXMuaW5hY3RpdmVCb25kcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlIGRlc2t0b3AgdmVyc2lvbiBvZiBzdHVkZW50IGhvbWUgcGFnZSBwYWdlLlxyXG4gICAqL1xyXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VTdHVkZW50SG9tZVBhZ2UoaG9tZXBhZ2U6IFBhZ2UpIHtcclxuICAgIGNvbnN0IHJvd3MgPSBob21lcGFnZS4kKCcjcGVyZmlsLWRvY2VudGUgdGFibGUnKS5lcSgwKS5maW5kKCd0cicpLnRvQXJyYXkoKTtcclxuICAgIGxldCByZWdpc3RyYXRpb247XHJcbiAgICBsZXQgcHJvZ3JhbTtcclxuICAgIGxldCBzdGF0dXM7XHJcblxyXG4gICAgY29uc3QgYnV0dG9uU3dpdGNoQm9uZCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxyXG4gICAgICBob21lcGFnZS4kKCcjaW5mby11c3VhcmlvIHAgaSBzbWFsbCBhJykuaHRtbCgpXHJcbiAgICApO1xyXG4gICAgaWYgKGJ1dHRvblN3aXRjaEJvbmQgPT09ICdBbHRlcmFyIHbDrW5jdWxvJykge1xyXG4gICAgICBjb25zdCBib25kUGFnZSA9IGF3YWl0IHRoaXMuaHR0cC5nZXQoJy9zaWdhYS92aW5jdWxvcy5qc2YnKTtcclxuICAgICAgcmV0dXJuIHRoaXMucGFyc2VCb25kUGFnZShib25kUGFnZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xyXG4gICAgICBjb25zdCBjZWxscyA9IGhvbWVwYWdlLiQocm93KS5maW5kKCd0ZCcpO1xyXG4gICAgICBpZiAoY2VsbHMubGVuZ3RoICE9PSAyKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogSW52YWxpZCBzdHVkZW50IGRldGFpbHMgcGFnZS4nKTtcclxuICAgICAgfVxyXG4gICAgICBjb25zdCByb3dOYW1lID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZXEoMCkuaHRtbCgpKTtcclxuICAgICAgc3dpdGNoIChyb3dOYW1lKSB7XHJcbiAgICAgICAgY2FzZSAnTWF0csOtY3VsYTonOlxyXG4gICAgICAgICAgcmVnaXN0cmF0aW9uID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZXEoMSkuaHRtbCgpKTtcclxuICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ0N1cnNvOic6XHJcbiAgICAgICAgICBwcm9ncmFtID0gdGhpcy5wYXJzZXJcclxuICAgICAgICAgICAgLnJlbW92ZVRhZ3NIdG1sKGNlbGxzLmVxKDEpLmh0bWwoKSlcclxuICAgICAgICAgICAgLnJlcGxhY2UoLyAtIChNfFR8TikkL2csICcnKTsgLy8gUmVtb3ZlIHNjaGVkdWxlIGxldHRlclxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnU3RhdHVzOic6XHJcbiAgICAgICAgICBzdGF0dXMgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChjZWxscy5lcSgxKS5odG1sKCkpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChyZWdpc3RyYXRpb24gJiYgcHJvZ3JhbSAmJiBzdGF0dXMpIGJyZWFrO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghcmVnaXN0cmF0aW9uKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBTdHVkZW50IGJvbmQgd2l0aG91dCByZWdpc3RyYXRpb24gY29kZS4nKTtcclxuXHJcbiAgICBpZiAoIXByb2dyYW0pIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFN0dWRlbnQgYm9uZCBwcm9ncmFtIG5vdCBmb3VuZC4nKTtcclxuXHJcbiAgICBpZiAoIXN0YXR1cykgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogU3R1ZGVudCBib25kIHN0YXR1cyBub3QgZm91bmQuJyk7XHJcbiAgICBpZiAoc3RhdHVzID09PSAnQ1VSU0FORE8nIHx8IHN0YXR1cyA9PT0gJ0NPTkNMVUlOVEUnKVxyXG4gICAgICB0aGlzLmFjdGl2ZUJvbmRzLnB1c2goXHJcbiAgICAgICAgdGhpcy5ib25kRmFjdG9yeS5jcmVhdGVTdHVkZW50Qm9uZChyZWdpc3RyYXRpb24sIHByb2dyYW0sIG51bGwpXHJcbiAgICAgICk7XHJcbiAgICBlbHNlXHJcbiAgICAgIHRoaXMuaW5hY3RpdmVCb25kcy5wdXNoKFxyXG4gICAgICAgIHRoaXMuYm9uZEZhY3RvcnkuY3JlYXRlU3R1ZGVudEJvbmQocmVnaXN0cmF0aW9uLCBwcm9ncmFtLCBudWxsKVxyXG4gICAgICApO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQGluaGVyaXRkb2NcclxuICAgKi9cclxuICBsb2dvZmYoKTogUHJvbWlzZTx2b2lkPiB7XHJcbiAgICByZXR1cm4gdGhpcy5odHRwXHJcbiAgICAgIC5nZXQoJy9zaWdhYS9sb2dhci5kbz9kaXNwYXRjaD1sb2dPZmYnKVxyXG4gICAgICAudGhlbigocGFnZSkgPT4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmh0dHAuZm9sbG93QWxsUmVkaXJlY3QocGFnZSk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC50aGVuKChwYWdlKSA9PiB7XHJcbiAgICAgICAgaWYgKHBhZ2Uuc3RhdHVzQ29kZSAhPT0gMjAwKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBJbnZhbGlkIHN0YXR1cyBjb2RlIGluIGxvZ29mZiBwYWdlLicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNlc3Npb24ubG9naW5TdGF0dXMgPSBMb2dpblN0YXR1cy5VbmF1dGhlbnRpY2F0ZWQ7XHJcbiAgICAgICAgdGhpcy5odHRwLmNsb3NlU2Vzc2lvbigpO1xyXG4gICAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEdldCBwcm9maWxlIHBpY3R1cmUgVVJMLlxyXG4gICAqIEByZXR1bnMgUGljdHVyZSB1cmwgb3IgbnVsbCBpZiB0aGUgdXNlciBoYXMgbm8gcGhvdG8uXHJcbiAgICovXHJcbiAgYXN5bmMgZ2V0UHJvZmlsZVBpY3R1cmVVUkwoKTogUHJvbWlzZTxVUkwgfCBudWxsPiB7XHJcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5odHRwLmdldCgnL3NpZ2FhL3BvcnRhaXMvZGlzY2VudGUvZGlzY2VudGUuanNmJyk7XHJcblxyXG4gICAgY29uc3QgcGljdHVyZUVsZW1lbnQgPSBwYWdlLiQoJ2RpdltjbGFzcz1cImZvdG9cIl0gaW1nJyk7XHJcbiAgICBpZiAocGljdHVyZUVsZW1lbnQubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcclxuICAgIGNvbnN0IHBpY3R1cmVTcmMgPSBwaWN0dXJlRWxlbWVudC5hdHRyKCdzcmMnKTtcclxuICAgIGlmICghcGljdHVyZVNyYyB8fCBwaWN0dXJlU3JjLmluY2x1ZGVzKCcvc2lnYWEvaW1nL25vX3BpY3R1cmUucG5nJykpXHJcbiAgICAgIHJldHVybiBudWxsO1xyXG4gICAgcmV0dXJuIG5ldyBVUkwocGljdHVyZVNyYywgcGFnZS51cmwpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRG93bmxvYWQgcHJvZmlsZSB1cmwgYW5kIHNhdmUgaW4gYmFzZXBhdGguXHJcbiAgICogQHBhcmFtIGRlc3RwYXRoIEl0IGNhbiBiZSBhIGZvbGRlciBvciBhIGZpbGUgbmFtZSwgaWYgaXQgaXMgYSBkaXJlY3RvcnkgdGhlbiBpdCB3aWxsIGJlIHNhdmVkIGluc2lkZSB0aGUgZm9sZGVyLCBpZiBpdCBpcyBhIGZpbGUgbmFtZSBpdCB3aWxsIGJlIHNhdmVkIGV4YWN0bHkgaW4gdGhpcyBwbGFjZSwgYnV0IGlmIHRoZSBmb2xkZXIgZG9lcyBub3QgZXhpc3QgaXQgd2lsbCB0aHJvdyBhbiBlcnJvci5cclxuICAgKiBAcGFyYW0gY2FsbGJhY2sgVG8ga25vdyB0aGUgcHJvZ3Jlc3Mgb2YgdGhlIGRvd25sb2FkLCBlYWNoIGRvd25sb2FkZWQgcGFydCB3aWxsIGJlIGNhbGxlZCBpbmZvcm1pbmcgaG93IG11Y2ggaGFzIGFscmVhZHkgYmVlbiBkb3dubG9hZGVkLlxyXG4gICAqIEByZXR1bnMgRnVsbCBwYXRoIG9mIHRoZSBkb3dubG9hZGVkIGZpbGUsIHVzZWZ1bCBpZiB0aGUgZGVzdHBhdGggaXMgYSBkaXJlY3RvcnksIG9yIG51bGwgaWYgdGhlIHVzZXIgaGFzIG5vIHBob3RvLlxyXG4gICAqL1xyXG4gIGFzeW5jIGRvd25sb2FkUHJvZmlsZVBpY3R1cmUoXHJcbiAgICBkZXN0cGF0aDogc3RyaW5nLFxyXG4gICAgY2FsbGJhY2s/OiBQcm9ncmVzc0NhbGxiYWNrXHJcbiAgKTogUHJvbWlzZTxzdHJpbmcgfCBudWxsPiB7XHJcbiAgICBjb25zdCBwaWN0dXJlVVJMID0gYXdhaXQgdGhpcy5nZXRQcm9maWxlUGljdHVyZVVSTCgpO1xyXG4gICAgaWYgKCFwaWN0dXJlVVJMKSByZXR1cm4gbnVsbDtcclxuICAgIHJldHVybiB0aGlzLmh0dHAuZG93bmxvYWRGaWxlQnlHZXQocGljdHVyZVVSTC5ocmVmLCBkZXN0cGF0aCwgY2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQGluaGVyaXRkb2NcclxuICAgKi9cclxuICBhc3luYyBnZXROYW1lKCk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICBpZiAodGhpcy5fbmFtZSkgcmV0dXJuIHRoaXMuX25hbWU7XHJcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5odHRwLmdldCgnL3NpZ2FhL3BvcnRhaXMvZGlzY2VudGUvZGlzY2VudGUuanNmJyk7XHJcbiAgICBpZiAocGFnZS5zdGF0dXNDb2RlID09PSAyMDApIHtcclxuICAgICAgY29uc3QgdXNlcm5hbWUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcclxuICAgICAgICBwYWdlLiQoJ3AudXN1YXJpbyA+IHNwYW4nKS5odG1sKClcclxuICAgICAgKTtcclxuICAgICAgdGhpcy5fbmFtZSA9IHVzZXJuYW1lO1xyXG4gICAgICByZXR1cm4gdXNlcm5hbWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBVbmV4cGVjdGVkIHN0YXR1cyBjb2RlIGF0IHN0dWRlbnQgcHJvZmlsZSBwYWdlLicpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQGluaGVyaXRkb2NcclxuICAgKi9cclxuICBhc3luYyBnZXRFbWFpbHMoKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xyXG4gICAgaWYgKHRoaXMuX2VtYWlscykgcmV0dXJuIHRoaXMuX2VtYWlscztcclxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmh0dHAuZ2V0KCcvc2lnYWEvcG9ydGFpcy9kaXNjZW50ZS9kaXNjZW50ZS5qc2YnKTtcclxuICAgIGlmIChwYWdlLnN0YXR1c0NvZGUgPT09IDIwMCkge1xyXG4gICAgICBjb25zdCBidXR0b25zID0gcGFnZVxyXG4gICAgICAgIC4kKCcjcGVyZmlsLWRvY2VudGUgLnBlc3NvYWwtZG9jZW50ZScpXHJcbiAgICAgICAgLmZpbmQoJ2Fbb25jbGlja10nKVxyXG4gICAgICAgIC50b0FycmF5KCk7XHJcblxyXG4gICAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiBidXR0b25zKSB7XHJcbiAgICAgICAgY29uc3QgYnV0dG9uTmFtZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJChidXR0b24pLmh0bWwoKSk7XHJcbiAgICAgICAgaWYgKGJ1dHRvbk5hbWUgPT09ICdNZXVzIERhZG9zIFBlc3NvYWlzJykge1xyXG4gICAgICAgICAgY29uc3QgYnV0dG9uT25DbGljayA9IHBhZ2UuJChidXR0b24pLmF0dHIoJ29uY2xpY2snKTtcclxuICAgICAgICAgIGlmIChidXR0b25PbkNsaWNrKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZvcm0gPSBwYWdlLnBhcnNlSlNGQ0xKUyhidXR0b25PbkNsaWNrKTtcclxuICAgICAgICAgICAgY29uc3QgbXlQZXJzb25hbERhdGFQYWdlID0gYXdhaXQgdGhpcy5odHRwLnBvc3QoXHJcbiAgICAgICAgICAgICAgZm9ybS5hY3Rpb24uaHJlZixcclxuICAgICAgICAgICAgICBmb3JtLnBvc3RWYWx1ZXNcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY29uc3Qgcm93cyA9IG15UGVyc29uYWxEYXRhUGFnZVxyXG4gICAgICAgICAgICAgIC4kKCd0ZFtjb2xzcGFuPVwiM1wiXSB0YWJsZSB0Ym9keSB0cicpXHJcbiAgICAgICAgICAgICAgLnRvQXJyYXkoKTtcclxuICAgICAgICAgICAgdGhpcy5fZW1haWxzID0gW107XHJcbiAgICAgICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcclxuICAgICAgICAgICAgICBjb25zdCBlbWFpbCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJChyb3cpLmh0bWwoKSk7XHJcbiAgICAgICAgICAgICAgdGhpcy5fZW1haWxzLnB1c2goZW1haWwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIGlmICh0aGlzLl9lbWFpbHMpIHJldHVybiB0aGlzLl9lbWFpbHM7XHJcbiAgICAgIHJldHVybiBbXTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFVuZXhwZWN0ZWQgc3RhdHVzIGNvZGUgYXQgc3R1ZGVudCBwcm9maWxlIHBhZ2UuJyk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDaGFuZ2UgdGhlIHBhc3N3b3JkIG9mIGFjY291bnQuXHJcbiAgICogQHBhcmFtIG9sZFBhc3N3b3JkIGN1cnJlbnQgcGFzc3dvcmQuXHJcbiAgICogQHBhcmFtIG5ld1Bhc3N3b3JkIG5ldyBwYXNzd29yZC5cclxuICAgKiBAdGhyb3dzIHtlcnJvckludmFsaWRDcmVkZW50aWFsc30gSWYgY3VycmVudCBwYXNzd29yZCBpcyBub3QgY29ycmVjdC5cclxuICAgKiBAdGhyb3dzIHtlcnJvckluc3VmZmljaWVudFBhc3N3b3JkQ29tcGxleGl0eX0gSWYgdGhlIG5ldyBwYXNzd29yZCBkb2VzIG5vdCBoYXZlIHRoZSBjb21wbGV4aXR5IHJlcXVpcmVtZW50LlxyXG4gICAqL1xyXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKFxyXG4gICAgb2xkUGFzc3dvcmQ6IHN0cmluZyxcclxuICAgIG5ld1Bhc3N3b3JkOiBzdHJpbmdcclxuICApOiBQcm9taXNlPHZvaWQ+IHtcclxuICAgIGNvbnN0IGZvcm1QYWdlID0gYXdhaXQgdGhpcy5odHRwLmdldCgnL3NpZ2FhL2FsdGVyYXJfZGFkb3MuanNmJyk7XHJcbiAgICBpZiAoZm9ybVBhZ2Uuc3RhdHVzQ29kZSAhPT0gMzAyKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBVbmV4cGVjdGVkIHN0YXR1cyBjb2RlIGF0IGNoYW5nZSBwYXNzd29yZCBmb3JtLicpO1xyXG5cclxuICAgIGNvbnN0IHByZVBhZ2UgPSBhd2FpdCB0aGlzLmh0dHAuZm9sbG93QWxsUmVkaXJlY3QoZm9ybVBhZ2UpO1xyXG4gICAgaWYgKFxyXG4gICAgICBwcmVQYWdlLnN0YXR1c0NvZGUgIT09IDIwMCB8fFxyXG4gICAgICAhcHJlUGFnZS51cmwuaHJlZi5pbmNsdWRlcygndXN1YXJpby9hbHRlcmFyX2RhZG9zLmpzZicpXHJcbiAgICApXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEludmFsaWQgcHJlIHBhZ2UgYXQgY2hhbmdlIHBhc3N3b3JkLicpO1xyXG5cclxuICAgIGNvbnN0IHByZUZvcm1FbGVtZW50ID0gcHJlUGFnZS4kKCdmb3JtW25hbWU9XCJmb3JtXCJdJyk7XHJcblxyXG4gICAgY29uc3QgcHJlQWN0aW9uID0gcHJlRm9ybUVsZW1lbnQuYXR0cignYWN0aW9uJyk7XHJcbiAgICBpZiAoIXByZUFjdGlvbilcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICdTSUdBQTogRm9ybSB3aXRob3V0IGFjdGlvbiBhdCBjaGFuZ2UgcGFzc3dvcmQgcHJlIHBhZ2UuJ1xyXG4gICAgICApO1xyXG5cclxuICAgIGNvbnN0IHByZUFjdGlvblVybCA9IG5ldyBVUkwocHJlQWN0aW9uLCBwcmVQYWdlLnVybC5ocmVmKTtcclxuXHJcbiAgICBjb25zdCBwcmVQb3N0VmFsdWVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+ID0ge307XHJcblxyXG4gICAgY29uc3QgcHJlSW5wdXRzID0gcHJlRm9ybUVsZW1lbnRcclxuICAgICAgLmZpbmQoXCJpbnB1dFtuYW1lXTpub3QoW3R5cGU9J3N1Ym1pdCddKVwiKVxyXG4gICAgICAudG9BcnJheSgpO1xyXG4gICAgZm9yIChjb25zdCBpbnB1dCBvZiBwcmVJbnB1dHMpIHtcclxuICAgICAgY29uc3QgbmFtZSA9IHByZVBhZ2UuJChpbnB1dCkuYXR0cignbmFtZScpO1xyXG4gICAgICBpZiAobmFtZSkge1xyXG4gICAgICAgIHByZVBvc3RWYWx1ZXNbbmFtZV0gPSBwcmVQYWdlLiQoaW5wdXQpLnZhbCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBwcmVQb3N0VmFsdWVzWydmb3JtOmFsdGVyYXJTZW5oYSddID0gJ2Zvcm06YWx0ZXJhclNlbmhhJztcclxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmh0dHAucG9zdChwcmVBY3Rpb25VcmwuaHJlZiwgcHJlUG9zdFZhbHVlcyk7XHJcbiAgICBjb25zdCBmb3JtRWxlbWVudCA9IHBhZ2UuJCgnZm9ybVtuYW1lPVwiZm9ybVwiXScpO1xyXG5cclxuICAgIGNvbnN0IGFjdGlvbiA9IGZvcm1FbGVtZW50LmF0dHIoJ2FjdGlvbicpO1xyXG4gICAgaWYgKCFhY3Rpb24pXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEZvcm0gd2l0aG91dCBhY3Rpb24gYXQgY2hhbmdlIHBhc3N3b3JkIHBhZ2UuJyk7XHJcbiAgICBjb25zdCBmb3JtQWN0aW9uID0gbmV3IFVSTChhY3Rpb24sIHBhZ2UudXJsLmhyZWYpO1xyXG5cclxuICAgIGNvbnN0IHBvc3RWYWx1ZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcclxuICAgIGNvbnN0IGlucHV0cyA9IGZvcm1FbGVtZW50XHJcbiAgICAgIC5maW5kKFwiaW5wdXRbbmFtZV06bm90KFt0eXBlPSdzdWJtaXQnXSlcIilcclxuICAgICAgLnRvQXJyYXkoKTtcclxuICAgIGZvciAoY29uc3QgaW5wdXQgb2YgaW5wdXRzKSB7XHJcbiAgICAgIGNvbnN0IG5hbWUgPSBwYWdlLiQoaW5wdXQpLmF0dHIoJ25hbWUnKTtcclxuICAgICAgaWYgKG5hbWUpIHtcclxuICAgICAgICBwb3N0VmFsdWVzW25hbWVdID0gcHJlUGFnZS4kKGlucHV0KS52YWwoKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHBvc3RWYWx1ZXNbJ2Zvcm06c2VuaGFBdHVhbCddID0gb2xkUGFzc3dvcmQ7XHJcbiAgICBwb3N0VmFsdWVzWydmb3JtOm5vdmFTZW5oYSddID0gbmV3UGFzc3dvcmQ7XHJcbiAgICBwb3N0VmFsdWVzWydmb3JtOnJlcGV0bk5vdmFTZW5oYSddID0gbmV3UGFzc3dvcmQ7XHJcbiAgICBwb3N0VmFsdWVzWydmb3JtOmFsdGVyYXJEYWRvcyddID0gJ0FsdGVyYXIgRGFkb3MnO1xyXG5cclxuICAgIGNvbnN0IHJlc3VsdFBhZ2UgPSBhd2FpdCB0aGlzLmh0dHAucG9zdChmb3JtQWN0aW9uLmhyZWYsIHBvc3RWYWx1ZXMpO1xyXG5cclxuICAgIGlmIChyZXN1bHRQYWdlLnN0YXR1c0NvZGUgPT09IDIwMCkge1xyXG4gICAgICBjb25zdCBlcnJvck1zZyA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxyXG4gICAgICAgIHJlc3VsdFBhZ2UuJCgnLmVycm9zIGxpJykuaHRtbCgpXHJcbiAgICAgICk7XHJcbiAgICAgIGlmIChlcnJvck1zZy5pbmNsdWRlcygnQSBzZW5oYSBkaWdpdGFkYSDDqSBtdWl0byBzaW1wbGVzLicpKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKHRoaXMuZXJyb3JJbnN1ZmZpY2llbnRQYXNzd29yZENvbXBsZXhpdHkpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChlcnJvck1zZy5pbmNsdWRlcygnU2VuaGEgQXR1YWwgZGlnaXRhZGEgbsOjbyBjb25mZXJlJykpIHtcclxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5lcnJvckludmFsaWRDcmVkZW50aWFscyk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAocmVzdWx0UGFnZS5zdGF0dXNDb2RlICE9PSAzMDIpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxyXG4gICAgICAgICdTSUdBQTogVGhlIGNoYW5nZSBwYXNzd29yZCBwYWdlIHN0YXR1cyBjb2RlIGlzIGRpZmZlcmVudCB0aGFuIGV4cGVjdGVkLidcclxuICAgICAgKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19