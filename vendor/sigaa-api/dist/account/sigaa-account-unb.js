"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaAccountUNB = void 0;

require("source-map-support/register");

var _sigaaTypes = require("../sigaa-types");

var _url = require("url");

var _sigaaDebug = require("../helpers/sigaa-debug");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Responsible for representing the user account.
 * @category Internal
 */
class SigaaAccountUNB {
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
    } else if (homepage.url.href.includes('/sigaa/telaAvisoLogon.jsf')) {
      this.pagehomeParsePromise = this.http.get('/sigaa/vinculos.jsf').then(page => this.parseBondPage(page));
    } else {
      // Some institutions (e.g. UFRPE) open a notice or menu page after login,
      // so we try to open the student portal directly.
      this.pagehomeParsePromise = this.openStudentPortal(homepage);
    }
  }
  /**
   * Opens the student portal when the page after login is not recognized.
   * @param homepage page received after login.
   */


  async openStudentPortal(homepage) {
    const portalPage = await this.http.followAllRedirect(await this.http.get('/sigaa/verPortalDiscente.do', {
      noCache: true
    }), {
      noCache: true
    });

    if (portalPage.url.href.includes('/portais/discente/discente.jsf')) {
      return this.parseStudentHomePage(portalPage);
    }

    if (portalPage.url.href.includes('/sigaa/vinculos.jsf') || portalPage.url.href.includes('/sigaa/escolhaVinculo.do')) {
      return this.parseBondPage(portalPage);
    }

    (0, _sigaaDebug.saveDebugPage)('homepage', homepage);
    (0, _sigaaDebug.saveDebugPage)('portal', portalPage);
    throw new Error(`SIGAA: Unknown homepage format. After login: ${homepage.url.pathname}, student portal: ${portalPage.url.pathname}`);
  }
  /**
   * Parse bond page.
   * @param page page to parse.
   */


  async parseBondPage(page) {
    if (page.$('table.tabela-selecao-vinculo').length > 0) {
      this.parseBondSelectionTables(page);
      if (this.activeBonds.length === 0) (0, _sigaaDebug.saveDebugPage)('vinculos', page);
      return;
    }

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

    if (this.activeBonds.length === 0) (0, _sigaaDebug.saveDebugPage)('vinculos', page);
  }
  /**
   * Parse bond page of newer SIGAA versions (e.g. UFRPE, v4.19), where the
   * bonds are split into the tables "Ativos" and "Inativos" with the columns:
   * link | Vínculo | Identificador | Outras informações.
   * @param page page to parse.
   */


  parseBondSelectionTables(page) {
    const tables = page.$('table.tabela-selecao-vinculo').toArray();

    for (const table of tables) {
      const caption = this.parser.removeTagsHtml(page.$(table).find('caption').html());
      const isActive = caption === 'Ativos';
      const rows = page.$(table).find('tbody tr').toArray();

      for (const row of rows) {
        const cells = page.$(row).find('td');
        if (cells.length < 4) continue;
        const bondType = this.parser.removeTagsHtml(cells.eq(1).html());
        let bond;

        if (bondType.startsWith('Discente')) {
          const registration = this.parser.removeTagsHtml(cells.eq(2).html());
          const url = page.$(row).find('a[href]').attr('href');
          if (!url) throw new Error('SIGAA: Bond switch url could not be found.');
          const bondSwitchUrl = new _url.URL(url, page.url);
          const program = this.parser.removeTagsHtml(cells.eq(3).html()).replace(/^Curso: /g, '');
          bond = this.bondFactory.createStudentBond(registration, program, bondSwitchUrl);
        } else if (bondType.startsWith('Docente')) {
          bond = this.bondFactory.createTeacherBond();
        }

        if (!bond) continue;
        if (isActive) this.activeBonds.push(bond);else this.inactiveBonds.push(bond);
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
    let registration;
    let program;
    let status;
    const buttonSwitchBond = this.parser.removeTagsHtml(homepage.$('#info-usuario p i small a').html());

    if (buttonSwitchBond === 'Alterar vínculo') {
      const bondPage = await this.http.get('/sigaa/vinculos.jsf');
      return this.parseBondPage(bondPage);
    } // The layout varies between institutions, so the details are searched as
    // "label | value" cell pairs anywhere in the page.


    const cells = homepage.$('td, th').toArray();

    for (let i = 0; i < cells.length - 1; i++) {
      const rowName = this.parser.removeTagsHtml(homepage.$(cells[i]).html()).replace(/:$/, '').trim().toLowerCase();

      const value = () => this.parser.removeTagsHtml(homepage.$(cells[i + 1]).html());

      if (rowName === 'matrícula' && !registration) {
        registration = value();
      } else if (rowName === 'curso' && !program) {
        program = value().replace(/ - (M|T|N|MT|TN|MN)$/g, ''); // Remove schedule letter
      } else if (rowName === 'status' && !status) {
        status = value();
      }

      if (registration && program && status) break;
    }

    if (!registration) {
      (0, _sigaaDebug.saveDebugPage)('portal-discente', homepage);
      throw new Error('SIGAA: Student bond without registration code.');
    }

    if (!program) {
      (0, _sigaaDebug.saveDebugPage)('portal-discente', homepage);
      throw new Error('SIGAA: Student bond program not found.');
    } // Without status the bond is considered active


    if (!status || /CURSANDO|CONCLUINTE|ATIVO|FORMANDO/i.test(status)) this.activeBonds.push(this.bondFactory.createStudentBond(registration, program, null));else {
      console.log(`SIGAA: WARNING student bond with status: ${status}`);
      (0, _sigaaDebug.saveDebugPage)('portal-discente', homepage);
      this.inactiveBonds.push(this.bondFactory.createStudentBond(registration, program, null));
    }
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
    const page = await this.http.followAllRedirect(await this.http.get('/sigaa/verPortalDiscente.do'));
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
    const page = await this.http.followAllRedirect(await this.http.get('/sigaa/verPortalDiscente.do'));

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
    const page = await this.http.followAllRedirect(await this.http.get('/sigaa/verPortalDiscente.do'));

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

exports.SigaaAccountUNB = SigaaAccountUNB;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9hY2NvdW50L3NpZ2FhLWFjY291bnQtdW5iLnRzIl0sIm5hbWVzIjpbIlNpZ2FhQWNjb3VudFVOQiIsImNvbnN0cnVjdG9yIiwiaG9tZXBhZ2UiLCJodHRwIiwicGFyc2VyIiwic2Vzc2lvbiIsImJvbmRGYWN0b3J5IiwicGFyc2VIb21lcGFnZSIsImJvZHlEZWNvZGVkIiwiaW5jbHVkZXMiLCJFcnJvciIsInVybCIsImhyZWYiLCJwYWdlaG9tZVBhcnNlUHJvbWlzZSIsInBhcnNlU3R1ZGVudEhvbWVQYWdlIiwicGFyc2VCb25kUGFnZSIsImdldCIsIm5vQ2FjaGUiLCJ0aGVuIiwicGFnZSIsIm9wZW5TdHVkZW50UG9ydGFsIiwicG9ydGFsUGFnZSIsImZvbGxvd0FsbFJlZGlyZWN0IiwicGF0aG5hbWUiLCIkIiwibGVuZ3RoIiwicGFyc2VCb25kU2VsZWN0aW9uVGFibGVzIiwiYWN0aXZlQm9uZHMiLCJyb3dzIiwidG9BcnJheSIsInJvdyIsImNlbGxzIiwiZmluZCIsImJvbmRUeXBlIiwicmVtb3ZlVGFnc0h0bWwiLCJodG1sIiwic3RhdHVzIiwiYm9uZCIsInJlZ2lzdHJhdGlvbiIsImF0dHIiLCJib25kU3dpdGNoVXJsIiwiVVJMIiwicHJvZ3JhbSIsInJlcGxhY2UiLCJjcmVhdGVTdHVkZW50Qm9uZCIsImNyZWF0ZVRlYWNoZXJCb25kIiwicHVzaCIsImluYWN0aXZlQm9uZHMiLCJjb25zb2xlIiwibG9nIiwidGFibGVzIiwidGFibGUiLCJjYXB0aW9uIiwiaXNBY3RpdmUiLCJlcSIsInN0YXJ0c1dpdGgiLCJnZXRBY3RpdmVCb25kcyIsImdldEluYWN0aXZlQm9uZHMiLCJidXR0b25Td2l0Y2hCb25kIiwiYm9uZFBhZ2UiLCJpIiwicm93TmFtZSIsInRyaW0iLCJ0b0xvd2VyQ2FzZSIsInZhbHVlIiwidGVzdCIsImxvZ29mZiIsInN0YXR1c0NvZGUiLCJsb2dpblN0YXR1cyIsIkxvZ2luU3RhdHVzIiwiVW5hdXRoZW50aWNhdGVkIiwiY2xvc2VTZXNzaW9uIiwiZ2V0UHJvZmlsZVBpY3R1cmVVUkwiLCJwaWN0dXJlRWxlbWVudCIsInBpY3R1cmVTcmMiLCJkb3dubG9hZFByb2ZpbGVQaWN0dXJlIiwiZGVzdHBhdGgiLCJjYWxsYmFjayIsInBpY3R1cmVVUkwiLCJkb3dubG9hZEZpbGVCeUdldCIsImdldE5hbWUiLCJfbmFtZSIsInVzZXJuYW1lIiwiZ2V0RW1haWxzIiwiX2VtYWlscyIsImJ1dHRvbnMiLCJidXR0b24iLCJidXR0b25OYW1lIiwiYnV0dG9uT25DbGljayIsImZvcm0iLCJwYXJzZUpTRkNMSlMiLCJteVBlcnNvbmFsRGF0YVBhZ2UiLCJwb3N0IiwiYWN0aW9uIiwicG9zdFZhbHVlcyIsImVtYWlsIiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwiZm9ybVBhZ2UiLCJwcmVQYWdlIiwicHJlRm9ybUVsZW1lbnQiLCJwcmVBY3Rpb24iLCJwcmVBY3Rpb25VcmwiLCJwcmVQb3N0VmFsdWVzIiwicHJlSW5wdXRzIiwiaW5wdXQiLCJuYW1lIiwidmFsIiwiZm9ybUVsZW1lbnQiLCJmb3JtQWN0aW9uIiwiaW5wdXRzIiwicmVzdWx0UGFnZSIsImVycm9yTXNnIiwiZXJyb3JJbnN1ZmZpY2llbnRQYXNzd29yZENvbXBsZXhpdHkiLCJlcnJvckludmFsaWRDcmVkZW50aWFscyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBR0E7O0FBSUE7O0FBQ0E7Ozs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNPLE1BQU1BLGVBQU4sQ0FBeUM7QUFDOUM7QUFDRjtBQUNBO0FBQ0VDLEVBQUFBLFdBQVcsQ0FDVEMsUUFEUyxFQUVEQyxJQUZDLEVBR0RDLE1BSEMsRUFJREMsT0FKQyxFQUtEQyxXQUxDLEVBTVQ7QUFBQSxTQUpRSCxJQUlSLEdBSlFBLElBSVI7QUFBQSxTQUhRQyxNQUdSLEdBSFFBLE1BR1I7QUFBQSxTQUZRQyxPQUVSLEdBRlFBLE9BRVI7QUFBQSxTQURRQyxXQUNSLEdBRFFBLFdBQ1I7O0FB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UUFBUSxDQUFDeEcsUUFBVCxDQUFrQixrQ0FBbEIsQ0FBSixFQUEyRDtBQUN6RCxjQUFNLElBQUlDLEtBQUosQ0FBVSxLQUFLeUcsdUJBQWYsQ0FBTjtBQUNEO0FBQ0Y7O0FBRUQsUUFBSUgsVUFBVSxDQUFDN0MsVUFBWCxLQUEwQixHQUE5QixFQUFtQztBQUNqQyxZQUFNLElBQUl6RCxLQUFKLENBQ0oseUVBREksQ0FBTjtBQUdEO0FBQ0Y7O0FBamY2QyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBhcnNlciB9IGZyb20gJ0BoZWxwZXJzL3NpZ2FhLXBhcnNlcic7XG5pbXBvcnQgeyBIVFRQLCBQcm9ncmVzc0NhbGxiYWNrIH0gZnJvbSAnQHNlc3Npb24vc2lnYWEtaHR0cCc7XG5pbXBvcnQgeyBTZXNzaW9uIH0gZnJvbSAnQHNlc3Npb24vc2lnYWEtc2Vzc2lvbic7XG5pbXBvcnQgeyBMb2dpblN0YXR1cyB9IGZyb20gJy4uL3NpZ2FhLXR5cGVzJztcbmltcG9ydCB7IEJvbmRGYWN0b3J5LCBCb25kVHlwZSB9IGZyb20gJ0Bib25kcy9zaWdhYS1ib25kLWZhY3RvcnknO1xuaW1wb3J0IHsgUGFnZSB9IGZyb20gJ0BzZXNzaW9uL3NpZ2FhLXBhZ2UnO1xuaW1wb3J0IHsgQWNjb3VudCB9IGZyb20gJy4vc2lnYWEtYWNjb3VudCc7XG5pbXBvcnQgeyBVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgc2F2ZURlYnVnUGFnZSB9IGZyb20gJ0BoZWxwZXJzL3NpZ2FhLWRlYnVnJztcblxuLyoqXG4gKiBSZXNwb25zaWJsZSBmb3IgcmVwcmVzZW50aW5nIHRoZSB1c2VyIGFjY291bnQuXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ2FhQWNjb3VudFVOQiBpbXBsZW1lbnRzIEFjY291bnQge1xuICAvKipcbiAgICogQHBhcmFtIGhvbWVwYWdlIGhvbWVwYWdlIChwYWdlIGFmdGVyIGxvZ2luKSBvZiB1c2VyLlxuICAgKi9cbiAgY29uc3RydWN0b3IoXG4gICAgaG9tZXBhZ2U6IFBhZ2UsXG4gICAgcHJpdmF0ZSBodHRwOiBIVFRQLFxuICAgIHByaXZhdGUgcGFyc2VyOiBQYXJzZXIsXG4gICAgcHJpdmF0ZSBzZXNzaW9uOiBTZXNzaW9uLFxuICAgIHByaXZhdGUgYm9uZEZhY3Rvcnk6IEJvbmRGYWN0b3J5XG4gICkge1xuICAgIHRoaXMucGFyc2VIb21lcGFnZShob21lcGFnZSk7XG4gIH1cblxuICAvKipcbiAgICogRXJyb3IgbWVzc2FnZSB3aGVuIHRoZSBuZXcgcGFzc3dvcmQgY2hvc2VuIGRvZXMgbm90IG1lZXQgdGhlIHNlY3VyaXR5IHJlcXVpcmVtZW50cyBvZiBTSUdBQS5cbiAgICogSXQgaXMgdGhyb3duIGJ5IHRoZSBjaGFuZ2VQYXNzd29yZCgpIG1ldGhvZFxuICAgKi9cbiAgcmVhZG9ubHkgZXJyb3JJbnZhbGlkQ3JlZGVudGlhbHMgPSAnU0lHQUE6IEludmFsaWQgY3JlZGVudGlhbHMuJztcblxuICAvKipcbiAgICogRXJyb3IgbWVzc2FnZSB3aGVuIHRoZSBvbGQgcGFzc3dvcmQgaXMgbm90IHRoZSBjdXJyZW50IHBhc3N3b3JkLlxuICAgKiBJdCBpcyB0aHJvd24gYnkgdGhlIGNoYW5nZVBhc3N3b3JkKCkgbWV0aG9kLlxuICAgKi9cbiAgcmVhZG9ubHkgZXJyb3JJbnN1ZmZpY2llbnRQYXNzd29yZENvbXBsZXhpdHkgPVxuICAgICdTSUdBQTogSW5zdWZmaWNlbnQgcGFzc3dvcmQgY29tcGxleGl0eS4nO1xuXG4gIC8qKlxuICAgKiBTdHVkZW50IG5hbWUgY2FjaGVcbiAgICovXG4gIHByaXZhdGUgX25hbWU/OiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFN0dWRlbnQgZS1tYWlsIGNhY2hlXG4gICAqL1xuICBwcml2YXRlIF9lbWFpbHM/OiBzdHJpbmdbXTtcblxuICAvKipcbiAgICogQXJyYXkgb2YgYWN0aXZlIGJvbmRzLlxuICAgKi9cbiAgcHJpdmF0ZSBhY3RpdmVCb25kczogQm9uZFR5cGVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBBcnJheSBvZiBpbmFjdGl2ZSBib25kcy5cbiAgICovXG4gIHByaXZhdGUgaW5hY3RpdmVCb25kczogQm9uZFR5cGVbXSA9IFtdO1xuXG4gIC8qKlxuICAgKiBJdCBpcyBhIHByb21pc2UgdGhhdCBzdG9yZXMgaWYgdGhlIHBhZ2UgcGFyc2VyIGhhcyBhbHJlYWR5IGNvbXBsZXRlZFxuICAgKi9cbiAgcHJpdmF0ZSBwYWdlaG9tZVBhcnNlUHJvbWlzZT86IFByb21pc2U8dm9pZD47XG5cbiAgLyoqXG4gICAqIFBhcnNlIGxvZ2luIHJlc3VsdCBwYWdlIHRvIGZpbGwgdGhlIGluc3RhbmNlLlxuICAgKlxuICAgKiBAcGFyYW0gaG9tZXBhZ2UgaG9tZSBwYWdlIHRvIHBhcnNlLlxuICAgKi9cbiAgcHJpdmF0ZSBwYXJzZUhvbWVwYWdlKGhvbWVwYWdlOiBQYWdlKTogdm9pZCB7XG4gICAgLy9TaW5jZSB0aGUgbG9naW4gcGFnZSBjYW4gdmFyeSwgd2Ugc2hvdWxkIGNoZWNrIHRoZSB0eXBlIG9mIHBhZ2UuXG4gICAgaWYgKFxuICAgICAgaG9tZXBhZ2UuYm9keURlY29kZWQuaW5jbHVkZXMoXG4gICAgICAgICdPIHNpc3RlbWEgY29tcG9ydG91LXNlIGRlIGZvcm1hIGluZXNwZXJhZGEnXG4gICAgICApXG4gICAgKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdTSUdBQTogSW52YWxpZCBob21lcGFnZSwgdGhlIHN5c3RlbSBiZWhhdmVkIHVuZXhwZWN0ZWRseS4nXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAoaG9tZXBhZ2UudXJsLmhyZWYuaW5jbHVkZXMoJy9wb3J0YWlzL2Rpc2NlbnRlL2Rpc2NlbnRlLmpzZicpKSB7XG4gICAgICAvL0lmIGl0IGlzIGhvbWUgcGFnZSBzdHVkZW50IG9mIGRlc2t0b3AgdmVyc2lvbi5cbiAgICAgIHRoaXMucGFnZWhvbWVQYXJzZVByb21pc2UgPSB0aGlzLnBhcnNlU3R1ZGVudEhvbWVQYWdlKGhvbWVwYWdlKTtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgaG9tZXBhZ2UudXJsLmhyZWYuaW5jbHVkZXMoJy9zaWdhYS92aW5jdWxvcy5qc2YnKSB8fFxuICAgICAgaG9tZXBhZ2UudXJsLmhyZWYuaW5jbHVkZXMoJy9zaWdhYS9lc2NvbGhhVmluY3Vsby5kbycpXG4gICAgKSB7XG4gICAgICAvL0lmIGl0IGlzIGJvbmQgcGFnZS5cbiAgICAgIHRoaXMucGFnZWhvbWVQYXJzZVByb21pc2UgPSB0aGlzLnBhcnNlQm9uZFBhZ2UoaG9tZXBhZ2UpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBob21lcGFnZS51cmwuaHJlZi5pbmNsdWRlcygnL3NpZ2FhL3RlbGFzUG9zU2VsZWNhb1ZpbmN1bG9zLmpzZicpXG4gICAgKSB7XG4gICAgICB0aGlzLnBhZ2Vob21lUGFyc2VQcm9taXNlID0gdGhpcy5odHRwXG4gICAgICAgIC5nZXQoaG9tZXBhZ2UudXJsLmhyZWYsIHsgbm9DYWNoZTogdHJ1ZSB9KVxuICAgICAgICAudGhlbigocGFnZSkgPT4gdGhpcy5wYXJzZUJvbmRQYWdlKHBhZ2UpKTtcbiAgICB9IGVsc2UgaWYgKGhvbWVwYWdlLnVybC5ocmVmLmluY2x1ZGVzKCcvc2lnYWEvdGVsYUF2aXNvTG9nb24uanNmJykpIHtcbiAgICAgIHRoaXMucGFnZWhvbWVQYXJzZVByb21pc2UgPSB0aGlzLmh0dHBcbiAgICAgICAgLmdldCgnL3NpZ2FhL3ZpbmN1bG9zLmpzZicpXG4gICAgICAgIC50aGVuKChwYWdlKSA9PiB0aGlzLnBhcnNlQm9uZFBhZ2UocGFnZSkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTb21lIGluc3RpdHV0aW9ucyAoZS5nLiBVRlJQRSkgb3BlbiBhIG5vdGljZSBvciBtZW51IHBhZ2UgYWZ0ZXIgbG9naW4sXG4gICAgICAvLyBzbyB3ZSB0cnkgdG8gb3BlbiB0aGUgc3R1ZGVudCBwb3J0YWwgZGlyZWN0bHkuXG4gICAgICB0aGlzLnBhZ2Vob21lUGFyc2VQcm9taXNlID0gdGhpcy5vcGVuU3R1ZGVudFBvcnRhbChob21lcGFnZSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIE9wZW5zIHRoZSBzdHVkZW50IHBvcnRhbCB3aGVuIHRoZSBwYWdlIGFmdGVyIGxvZ2luIGlzIG5vdCByZWNvZ25pemVkLlxuICAgKiBAcGFyYW0gaG9tZXBhZ2UgcGFnZSByZWNlaXZlZCBhZnRlciBsb2dpbi5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgb3BlblN0dWRlbnRQb3J0YWwoaG9tZXBhZ2U6IFBhZ2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBwb3J0YWxQYWdlID0gYXdhaXQgdGhpcy5odHRwLmZvbGxvd0FsbFJlZGlyZWN0KFxuICAgICAgYXdhaXQgdGhpcy5odHRwLmdldCgnL3NpZ2FhL3ZlclBvcnRhbERpc2NlbnRlLmRvJywgeyBub0NhY2hlOiB0cnVlIH0pLFxuICAgICAgeyBub0NhY2hlOiB0cnVlIH1cbiAgICApO1xuICAgIGlmIChwb3J0YWxQYWdlLnVybC5ocmVmLmluY2x1ZGVzKCcvcG9ydGFpcy9kaXNjZW50ZS9kaXNjZW50ZS5qc2YnKSkge1xuICAgICAgcmV0dXJuIHRoaXMucGFyc2VTdHVkZW50SG9tZVBhZ2UocG9ydGFsUGFnZSk7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIHBvcnRhbFBhZ2UudXJsLmhyZWYuaW5jbHVkZXMoJy9zaWdhYS92aW5jdWxvcy5qc2YnKSB8fFxuICAgICAgcG9ydGFsUGFnZS51cmwuaHJlZi5pbmNsdWRlcygnL3NpZ2FhL2VzY29saGFWaW5jdWxvLmRvJylcbiAgICApIHtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlQm9uZFBhZ2UocG9ydGFsUGFnZSk7XG4gICAgfVxuICAgIHNhdmVEZWJ1Z1BhZ2UoJ2hvbWVwYWdlJywgaG9tZXBhZ2UpO1xuICAgIHNhdmVEZWJ1Z1BhZ2UoJ3BvcnRhbCcsIHBvcnRhbFBhZ2UpO1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgIGBTSUdBQTogVW5rbm93biBob21lcGFnZSBmb3JtYXQuIEFmdGVyIGxvZ2luOiAke2hvbWVwYWdlLnVybC5wYXRobmFtZX0sIHN0dWRlbnQgcG9ydGFsOiAke3BvcnRhbFBhZ2UudXJsLnBhdGhuYW1lfWBcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFBhcnNlIGJvbmQgcGFnZS5cbiAgICogQHBhcmFtIHBhZ2UgcGFnZSB0byBwYXJzZS5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VCb25kUGFnZShwYWdlOiBQYWdlKSB7XG4gICAgaWYgKHBhZ2UuJCgndGFibGUudGFiZWxhLXNlbGVjYW8tdmluY3VsbycpLmxlbmd0aCA+IDApIHtcbiAgICAgIHRoaXMucGFyc2VCb25kU2VsZWN0aW9uVGFibGVzKHBhZ2UpO1xuICAgICAgaWYgKHRoaXMuYWN0aXZlQm9uZHMubGVuZ3RoID09PSAwKSBzYXZlRGVidWdQYWdlKCd2aW5jdWxvcycsIHBhZ2UpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCByb3dzID0gcGFnZS4kKCd0YWJsZS5zdWJGb3JtdWxhcmlvIHRib2R5IHRyJykudG9BcnJheSgpO1xuICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgIGNvbnN0IGNlbGxzID0gcGFnZS4kKHJvdykuZmluZCgndGQnKS50b0FycmF5KCk7XG4gICAgICBpZiAoY2VsbHMubGVuZ3RoID09PSAwKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgYm9uZFR5cGUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcbiAgICAgICAgcGFnZS4kKHJvdykuZmluZCgnI3RkVGlwbycpLmh0bWwoKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IHN0YXR1cyA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJChjZWxsc1szXSkuaHRtbCgpKTtcbiAgICAgIGxldCBib25kO1xuICAgICAgc3dpdGNoIChib25kVHlwZSkge1xuICAgICAgICBjYXNlICdEaXNjZW50ZSc6IHtcbiAgICAgICAgICBjb25zdCByZWdpc3RyYXRpb24gPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcbiAgICAgICAgICAgIHBhZ2UuJChjZWxsc1syXSkuaHRtbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IHVybCA9IHBhZ2UuJChyb3cpLmZpbmQoJ2FbaHJlZl0nKS5hdHRyKCdocmVmJyk7XG4gICAgICAgICAgaWYgKCF1cmwpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBCb25kIHN3aXRjaCB1cmwgY291bGQgbm90IGJlIGZvdW5kLicpO1xuICAgICAgICAgIGNvbnN0IGJvbmRTd2l0Y2hVcmwgPSBuZXcgVVJMKHVybCwgcGFnZS51cmwpO1xuXG4gICAgICAgICAgY29uc3QgcHJvZ3JhbSA9IHRoaXMucGFyc2VyXG4gICAgICAgICAgICAucmVtb3ZlVGFnc0h0bWwocGFnZS4kKGNlbGxzWzRdKS5odG1sKCkpXG4gICAgICAgICAgICAucmVwbGFjZSgvXkN1cnNvOiAvZywgJycpO1xuICAgICAgICAgIGJvbmQgPSB0aGlzLmJvbmRGYWN0b3J5LmNyZWF0ZVN0dWRlbnRCb25kKFxuICAgICAgICAgICAgcmVnaXN0cmF0aW9uLFxuICAgICAgICAgICAgcHJvZ3JhbSxcbiAgICAgICAgICAgIGJvbmRTd2l0Y2hVcmxcbiAgICAgICAgICApO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ0RvY2VudGUnOiB7XG4gICAgICAgICAgYm9uZCA9IHRoaXMuYm9uZEZhY3RvcnkuY3JlYXRlVGVhY2hlckJvbmQoKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGJvbmQpXG4gICAgICAgIGlmIChzdGF0dXMgPT09ICdTaW0nKSB7XG4gICAgICAgICAgdGhpcy5hY3RpdmVCb25kcy5wdXNoKGJvbmQpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXR1cyA9PT0gJ07Do28nKSB7XG4gICAgICAgICAgdGhpcy5pbmFjdGl2ZUJvbmRzLnB1c2goYm9uZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ1NJR0FBOiBXQVJOSU5HIGludmFsaWQgc3RhdHVzOiAnICsgc3RhdHVzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodGhpcy5hY3RpdmVCb25kcy5sZW5ndGggPT09IDApIHNhdmVEZWJ1Z1BhZ2UoJ3ZpbmN1bG9zJywgcGFnZSk7XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgYm9uZCBwYWdlIG9mIG5ld2VyIFNJR0FBIHZlcnNpb25zIChlLmcuIFVGUlBFLCB2NC4xOSksIHdoZXJlIHRoZVxuICAgKiBib25kcyBhcmUgc3BsaXQgaW50byB0aGUgdGFibGVzIFwiQXRpdm9zXCIgYW5kIFwiSW5hdGl2b3NcIiB3aXRoIHRoZSBjb2x1bW5zOlxuICAgKiBsaW5rIHwgVsOtbmN1bG8gfCBJZGVudGlmaWNhZG9yIHwgT3V0cmFzIGluZm9ybWHDp8O1ZXMuXG4gICAqIEBwYXJhbSBwYWdlIHBhZ2UgdG8gcGFyc2UuXG4gICAqL1xuICBwcml2YXRlIHBhcnNlQm9uZFNlbGVjdGlvblRhYmxlcyhwYWdlOiBQYWdlKSB7XG4gICAgY29uc3QgdGFibGVzID0gcGFnZS4kKCd0YWJsZS50YWJlbGEtc2VsZWNhby12aW5jdWxvJykudG9BcnJheSgpO1xuICAgIGZvciAoY29uc3QgdGFibGUgb2YgdGFibGVzKSB7XG4gICAgICBjb25zdCBjYXB0aW9uID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXG4gICAgICAgIHBhZ2UuJCh0YWJsZSkuZmluZCgnY2FwdGlvbicpLmh0bWwoKVxuICAgICAgKTtcbiAgICAgIGNvbnN0IGlzQWN0aXZlID0gY2FwdGlvbiA9PT0gJ0F0aXZvcyc7XG4gICAgICBjb25zdCByb3dzID0gcGFnZS4kKHRhYmxlKS5maW5kKCd0Ym9keSB0cicpLnRvQXJyYXkoKTtcbiAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgY2VsbHMgPSBwYWdlLiQocm93KS5maW5kKCd0ZCcpO1xuICAgICAgICBpZiAoY2VsbHMubGVuZ3RoIDwgNCkgY29udGludWU7XG4gICAgICAgIGNvbnN0IGJvbmRUeXBlID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZXEoMSkuaHRtbCgpKTtcbiAgICAgICAgbGV0IGJvbmQ7XG4gICAgICAgIGlmIChib25kVHlwZS5zdGFydHNXaXRoKCdEaXNjZW50ZScpKSB7XG4gICAgICAgICAgY29uc3QgcmVnaXN0cmF0aW9uID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZXEoMikuaHRtbCgpKTtcbiAgICAgICAgICBjb25zdCB1cmwgPSBwYWdlLiQocm93KS5maW5kKCdhW2hyZWZdJykuYXR0cignaHJlZicpO1xuICAgICAgICAgIGlmICghdXJsKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogQm9uZCBzd2l0Y2ggdXJsIGNvdWxkIG5vdCBiZSBmb3VuZC4nKTtcbiAgICAgICAgICBjb25zdCBib25kU3dpdGNoVXJsID0gbmV3IFVSTCh1cmwsIHBhZ2UudXJsKTtcbiAgICAgICAgICBjb25zdCBwcm9ncmFtID0gdGhpcy5wYXJzZXJcbiAgICAgICAgICAgIC5yZW1vdmVUYWdzSHRtbChjZWxscy5lcSgzKS5odG1sKCkpXG4gICAgICAgICAgICAucmVwbGFjZSgvXkN1cnNvOiAvZywgJycpO1xuICAgICAgICAgIGJvbmQgPSB0aGlzLmJvbmRGYWN0b3J5LmNyZWF0ZVN0dWRlbnRCb25kKFxuICAgICAgICAgICAgcmVnaXN0cmF0aW9uLFxuICAgICAgICAgICAgcHJvZ3JhbSxcbiAgICAgICAgICAgIGJvbmRTd2l0Y2hVcmxcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2UgaWYgKGJvbmRUeXBlLnN0YXJ0c1dpdGgoJ0RvY2VudGUnKSkge1xuICAgICAgICAgIGJvbmQgPSB0aGlzLmJvbmRGYWN0b3J5LmNyZWF0ZVRlYWNoZXJCb25kKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFib25kKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGlzQWN0aXZlKSB0aGlzLmFjdGl2ZUJvbmRzLnB1c2goYm9uZCk7XG4gICAgICAgIGVsc2UgdGhpcy5pbmFjdGl2ZUJvbmRzLnB1c2goYm9uZCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0ZG9jXG4gICAqL1xuICBhc3luYyBnZXRBY3RpdmVCb25kcygpOiBQcm9taXNlPEJvbmRUeXBlW10+IHtcbiAgICBhd2FpdCB0aGlzLnBhZ2Vob21lUGFyc2VQcm9taXNlO1xuICAgIHJldHVybiB0aGlzLmFjdGl2ZUJvbmRzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0ZG9jXG4gICAqL1xuICBhc3luYyBnZXRJbmFjdGl2ZUJvbmRzKCk6IFByb21pc2U8Qm9uZFR5cGVbXT4ge1xuICAgIGF3YWl0IHRoaXMucGFnZWhvbWVQYXJzZVByb21pc2U7XG4gICAgcmV0dXJuIHRoaXMuaW5hY3RpdmVCb25kcztcbiAgfVxuXG4gIC8qKlxuICAgKiBQYXJzZSBkZXNrdG9wIHZlcnNpb24gb2Ygc3R1ZGVudCBob21lIHBhZ2UgcGFnZS5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcGFyc2VTdHVkZW50SG9tZVBhZ2UoaG9tZXBhZ2U6IFBhZ2UpIHtcbiAgICBsZXQgcmVnaXN0cmF0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gICAgbGV0IHByb2dyYW06IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBsZXQgc3RhdHVzOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG5cbiAgICBjb25zdCBidXR0b25Td2l0Y2hCb25kID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXG4gICAgICBob21lcGFnZS4kKCcjaW5mby11c3VhcmlvIHAgaSBzbWFsbCBhJykuaHRtbCgpXG4gICAgKTtcbiAgICBpZiAoYnV0dG9uU3dpdGNoQm9uZCA9PT0gJ0FsdGVyYXIgdsOtbmN1bG8nKSB7XG4gICAgICBjb25zdCBib25kUGFnZSA9IGF3YWl0IHRoaXMuaHR0cC5nZXQoJy9zaWdhYS92aW5jdWxvcy5qc2YnKTtcbiAgICAgIHJldHVybiB0aGlzLnBhcnNlQm9uZFBhZ2UoYm9uZFBhZ2UpO1xuICAgIH1cblxuICAgIC8vIFRoZSBsYXlvdXQgdmFyaWVzIGJldHdlZW4gaW5zdGl0dXRpb25zLCBzbyB0aGUgZGV0YWlscyBhcmUgc2VhcmNoZWQgYXNcbiAgICAvLyBcImxhYmVsIHwgdmFsdWVcIiBjZWxsIHBhaXJzIGFueXdoZXJlIGluIHRoZSBwYWdlLlxuICAgIGNvbnN0IGNlbGxzID0gaG9tZXBhZ2UuJCgndGQsIHRoJykudG9BcnJheSgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2VsbHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICBjb25zdCByb3dOYW1lID0gdGhpcy5wYXJzZXJcbiAgICAgICAgLnJlbW92ZVRhZ3NIdG1sKGhvbWVwYWdlLiQoY2VsbHNbaV0pLmh0bWwoKSlcbiAgICAgICAgLnJlcGxhY2UoLzokLywgJycpXG4gICAgICAgIC50cmltKClcbiAgICAgICAgLnRvTG93ZXJDYXNlKCk7XG4gICAgICBjb25zdCB2YWx1ZSA9ICgpID0+XG4gICAgICAgIHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGhvbWVwYWdlLiQoY2VsbHNbaSArIDFdKS5odG1sKCkpO1xuICAgICAgaWYgKHJvd05hbWUgPT09ICdtYXRyw61jdWxhJyAmJiAhcmVnaXN0cmF0aW9uKSB7XG4gICAgICAgIHJlZ2lzdHJhdGlvbiA9IHZhbHVlKCk7XG4gICAgICB9IGVsc2UgaWYgKHJvd05hbWUgPT09ICdjdXJzbycgJiYgIXByb2dyYW0pIHtcbiAgICAgICAgcHJvZ3JhbSA9IHZhbHVlKCkucmVwbGFjZSgvIC0gKE18VHxOfE1UfFROfE1OKSQvZywgJycpOyAvLyBSZW1vdmUgc2NoZWR1bGUgbGV0dGVyXG4gICAgICB9IGVsc2UgaWYgKHJvd05hbWUgPT09ICdzdGF0dXMnICYmICFzdGF0dXMpIHtcbiAgICAgICAgc3RhdHVzID0gdmFsdWUoKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZWdpc3RyYXRpb24gJiYgcHJvZ3JhbSAmJiBzdGF0dXMpIGJyZWFrO1xuICAgIH1cblxuICAgIGlmICghcmVnaXN0cmF0aW9uKSB7XG4gICAgICBzYXZlRGVidWdQYWdlKCdwb3J0YWwtZGlzY2VudGUnLCBob21lcGFnZSk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBTdHVkZW50IGJvbmQgd2l0aG91dCByZWdpc3RyYXRpb24gY29kZS4nKTtcbiAgICB9XG5cbiAgICBpZiAoIXByb2dyYW0pIHtcbiAgICAgIHNhdmVEZWJ1Z1BhZ2UoJ3BvcnRhbC1kaXNjZW50ZScsIGhvbWVwYWdlKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFN0dWRlbnQgYm9uZCBwcm9ncmFtIG5vdCBmb3VuZC4nKTtcbiAgICB9XG5cbiAgICAvLyBXaXRob3V0IHN0YXR1cyB0aGUgYm9uZCBpcyBjb25zaWRlcmVkIGFjdGl2ZVxuICAgIGlmICghc3RhdHVzIHx8IC9DVVJTQU5ET3xDT05DTFVJTlRFfEFUSVZPfEZPUk1BTkRPL2kudGVzdChzdGF0dXMpKVxuICAgICAgdGhpcy5hY3RpdmVCb25kcy5wdXNoKFxuICAgICAgICB0aGlzLmJvbmRGYWN0b3J5LmNyZWF0ZVN0dWRlbnRCb25kKHJlZ2lzdHJhdGlvbiwgcHJvZ3JhbSwgbnVsbClcbiAgICAgICk7XG4gICAgZWxzZSB7XG4gICAgICBjb25zb2xlLmxvZyhgU0lHQUE6IFdBUk5JTkcgc3R1ZGVudCBib25kIHdpdGggc3RhdHVzOiAke3N0YXR1c31gKTtcbiAgICAgIHNhdmVEZWJ1Z1BhZ2UoJ3BvcnRhbC1kaXNjZW50ZScsIGhvbWVwYWdlKTtcbiAgICAgIHRoaXMuaW5hY3RpdmVCb25kcy5wdXNoKFxuICAgICAgICB0aGlzLmJvbmRGYWN0b3J5LmNyZWF0ZVN0dWRlbnRCb25kKHJlZ2lzdHJhdGlvbiwgcHJvZ3JhbSwgbnVsbClcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0ZG9jXG4gICAqL1xuICBsb2dvZmYoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIHRoaXMuaHR0cFxuICAgICAgLmdldCgnL3NpZ2FhL2xvZ2FyLmRvP2Rpc3BhdGNoPWxvZ09mZicpXG4gICAgICAudGhlbigocGFnZSkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5odHRwLmZvbGxvd0FsbFJlZGlyZWN0KHBhZ2UpO1xuICAgICAgfSlcbiAgICAgIC50aGVuKChwYWdlKSA9PiB7XG4gICAgICAgIGlmIChwYWdlLnN0YXR1c0NvZGUgIT09IDIwMCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEludmFsaWQgc3RhdHVzIGNvZGUgaW4gbG9nb2ZmIHBhZ2UuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5zZXNzaW9uLmxvZ2luU3RhdHVzID0gTG9naW5TdGF0dXMuVW5hdXRoZW50aWNhdGVkO1xuICAgICAgICB0aGlzLmh0dHAuY2xvc2VTZXNzaW9uKCk7XG4gICAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgcHJvZmlsZSBwaWN0dXJlIFVSTC5cbiAgICogQHJldHVucyBQaWN0dXJlIHVybCBvciBudWxsIGlmIHRoZSB1c2VyIGhhcyBubyBwaG90by5cbiAgICovXG4gIGFzeW5jIGdldFByb2ZpbGVQaWN0dXJlVVJMKCk6IFByb21pc2U8VVJMIHwgbnVsbD4ge1xuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmh0dHAuZm9sbG93QWxsUmVkaXJlY3QoXG4gICAgICBhd2FpdCB0aGlzLmh0dHAuZ2V0KCcvc2lnYWEvdmVyUG9ydGFsRGlzY2VudGUuZG8nKVxuICAgICk7XG5cbiAgICBjb25zdCBwaWN0dXJlRWxlbWVudCA9IHBhZ2UuJCgnZGl2W2NsYXNzPVwiZm90b1wiXSBpbWcnKTtcbiAgICBpZiAocGljdHVyZUVsZW1lbnQubGVuZ3RoID09PSAwKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCBwaWN0dXJlU3JjID0gcGljdHVyZUVsZW1lbnQuYXR0cignc3JjJyk7XG4gICAgaWYgKCFwaWN0dXJlU3JjIHx8IHBpY3R1cmVTcmMuaW5jbHVkZXMoJy9zaWdhYS9pbWcvbm9fcGljdHVyZS5wbmcnKSlcbiAgICAgIHJldHVybiBudWxsO1xuICAgIHJldHVybiBuZXcgVVJMKHBpY3R1cmVTcmMsIHBhZ2UudXJsKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEb3dubG9hZCBwcm9maWxlIHVybCBhbmQgc2F2ZSBpbiBiYXNlcGF0aC5cbiAgICogQHBhcmFtIGRlc3RwYXRoIEl0IGNhbiBiZSBhIGZvbGRlciBvciBhIGZpbGUgbmFtZSwgaWYgaXQgaXMgYSBkaXJlY3RvcnkgdGhlbiBpdCB3aWxsIGJlIHNhdmVkIGluc2lkZSB0aGUgZm9sZGVyLCBpZiBpdCBpcyBhIGZpbGUgbmFtZSBpdCB3aWxsIGJlIHNhdmVkIGV4YWN0bHkgaW4gdGhpcyBwbGFjZSwgYnV0IGlmIHRoZSBmb2xkZXIgZG9lcyBub3QgZXhpc3QgaXQgd2lsbCB0aHJvdyBhbiBlcnJvci5cbiAgICogQHBhcmFtIGNhbGxiYWNrIFRvIGtub3cgdGhlIHByb2dyZXNzIG9mIHRoZSBkb3dubG9hZCwgZWFjaCBkb3dubG9hZGVkIHBhcnQgd2lsbCBiZSBjYWxsZWQgaW5mb3JtaW5nIGhvdyBtdWNoIGhhcyBhbHJlYWR5IGJlZW4gZG93bmxvYWRlZC5cbiAgICogQHJldHVucyBGdWxsIHBhdGggb2YgdGhlIGRvd25sb2FkZWQgZmlsZSwgdXNlZnVsIGlmIHRoZSBkZXN0cGF0aCBpcyBhIGRpcmVjdG9yeSwgb3IgbnVsbCBpZiB0aGUgdXNlciBoYXMgbm8gcGhvdG8uXG4gICAqL1xuICBhc3luYyBkb3dubG9hZFByb2ZpbGVQaWN0dXJlKFxuICAgIGRlc3RwYXRoOiBzdHJpbmcsXG4gICAgY2FsbGJhY2s/OiBQcm9ncmVzc0NhbGxiYWNrXG4gICk6IFByb21pc2U8c3RyaW5nIHwgbnVsbD4ge1xuICAgIGNvbnN0IHBpY3R1cmVVUkwgPSBhd2FpdCB0aGlzLmdldFByb2ZpbGVQaWN0dXJlVVJMKCk7XG4gICAgaWYgKCFwaWN0dXJlVVJMKSByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gdGhpcy5odHRwLmRvd25sb2FkRmlsZUJ5R2V0KHBpY3R1cmVVUkwuaHJlZiwgZGVzdHBhdGgsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgYXN5bmMgZ2V0TmFtZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGlmICh0aGlzLl9uYW1lKSByZXR1cm4gdGhpcy5fbmFtZTtcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5odHRwLmZvbGxvd0FsbFJlZGlyZWN0KFxuICAgICAgYXdhaXQgdGhpcy5odHRwLmdldCgnL3NpZ2FhL3ZlclBvcnRhbERpc2NlbnRlLmRvJylcbiAgICApO1xuICAgIGlmIChwYWdlLnN0YXR1c0NvZGUgPT09IDIwMCkge1xuICAgICAgY29uc3QgdXNlcm5hbWUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcbiAgICAgICAgcGFnZS4kKCdwLnVzdWFyaW8gPiBzcGFuJykuaHRtbCgpXG4gICAgICApO1xuICAgICAgdGhpcy5fbmFtZSA9IHVzZXJuYW1lO1xuICAgICAgcmV0dXJuIHVzZXJuYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBVbmV4cGVjdGVkIHN0YXR1cyBjb2RlIGF0IHN0dWRlbnQgcHJvZmlsZSBwYWdlLicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgYXN5bmMgZ2V0RW1haWxzKCk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICBpZiAodGhpcy5fZW1haWxzKSByZXR1cm4gdGhpcy5fZW1haWxzO1xuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmh0dHAuZm9sbG93QWxsUmVkaXJlY3QoXG4gICAgICBhd2FpdCB0aGlzLmh0dHAuZ2V0KCcvc2lnYWEvdmVyUG9ydGFsRGlzY2VudGUuZG8nKVxuICAgICk7XG4gICAgaWYgKHBhZ2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICBjb25zdCBidXR0b25zID0gcGFnZVxuICAgICAgICAuJCgnI3BlcmZpbC1kb2NlbnRlIC5wZXNzb2FsLWRvY2VudGUnKVxuICAgICAgICAuZmluZCgnYVtvbmNsaWNrXScpXG4gICAgICAgIC50b0FycmF5KCk7XG5cbiAgICAgIGZvciAoY29uc3QgYnV0dG9uIG9mIGJ1dHRvbnMpIHtcbiAgICAgICAgY29uc3QgYnV0dG9uTmFtZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJChidXR0b24pLmh0bWwoKSk7XG4gICAgICAgIGlmIChidXR0b25OYW1lID09PSAnTWV1cyBEYWRvcyBQZXNzb2FpcycpIHtcbiAgICAgICAgICBjb25zdCBidXR0b25PbkNsaWNrID0gcGFnZS4kKGJ1dHRvbikuYXR0cignb25jbGljaycpO1xuICAgICAgICAgIGlmIChidXR0b25PbkNsaWNrKSB7XG4gICAgICAgICAgICBjb25zdCBmb3JtID0gcGFnZS5wYXJzZUpTRkNMSlMoYnV0dG9uT25DbGljayk7XG4gICAgICAgICAgICBjb25zdCBteVBlcnNvbmFsRGF0YVBhZ2UgPSBhd2FpdCB0aGlzLmh0dHAucG9zdChcbiAgICAgICAgICAgICAgZm9ybS5hY3Rpb24uaHJlZixcbiAgICAgICAgICAgICAgZm9ybS5wb3N0VmFsdWVzXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3Qgcm93cyA9IG15UGVyc29uYWxEYXRhUGFnZVxuICAgICAgICAgICAgICAuJCgndGRbY29sc3Bhbj1cIjNcIl0gdGFibGUgdGJvZHkgdHInKVxuICAgICAgICAgICAgICAudG9BcnJheSgpO1xuICAgICAgICAgICAgdGhpcy5fZW1haWxzID0gW107XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGVtYWlsID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwocGFnZS4kKHJvdykuaHRtbCgpKTtcbiAgICAgICAgICAgICAgdGhpcy5fZW1haWxzLnB1c2goZW1haWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fZW1haWxzKSByZXR1cm4gdGhpcy5fZW1haWxzO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBVbmV4cGVjdGVkIHN0YXR1cyBjb2RlIGF0IHN0dWRlbnQgcHJvZmlsZSBwYWdlLicpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhlIHBhc3N3b3JkIG9mIGFjY291bnQuXG4gICAqIEBwYXJhbSBvbGRQYXNzd29yZCBjdXJyZW50IHBhc3N3b3JkLlxuICAgKiBAcGFyYW0gbmV3UGFzc3dvcmQgbmV3IHBhc3N3b3JkLlxuICAgKiBAdGhyb3dzIHtlcnJvckludmFsaWRDcmVkZW50aWFsc30gSWYgY3VycmVudCBwYXNzd29yZCBpcyBub3QgY29ycmVjdC5cbiAgICogQHRocm93cyB7ZXJyb3JJbnN1ZmZpY2llbnRQYXNzd29yZENvbXBsZXhpdHl9IElmIHRoZSBuZXcgcGFzc3dvcmQgZG9lcyBub3QgaGF2ZSB0aGUgY29tcGxleGl0eSByZXF1aXJlbWVudC5cbiAgICovXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKFxuICAgIG9sZFBhc3N3b3JkOiBzdHJpbmcsXG4gICAgbmV3UGFzc3dvcmQ6IHN0cmluZ1xuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBmb3JtUGFnZSA9IGF3YWl0IHRoaXMuaHR0cC5nZXQoJy9zaWdhYS9hbHRlcmFyX2RhZG9zLmpzZicpO1xuICAgIGlmIChmb3JtUGFnZS5zdGF0dXNDb2RlICE9PSAzMDIpXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBVbmV4cGVjdGVkIHN0YXR1cyBjb2RlIGF0IGNoYW5nZSBwYXNzd29yZCBmb3JtLicpO1xuXG4gICAgY29uc3QgcHJlUGFnZSA9IGF3YWl0IHRoaXMuaHR0cC5mb2xsb3dBbGxSZWRpcmVjdChmb3JtUGFnZSk7XG4gICAgaWYgKFxuICAgICAgcHJlUGFnZS5zdGF0dXNDb2RlICE9PSAyMDAgfHxcbiAgICAgICFwcmVQYWdlLnVybC5ocmVmLmluY2x1ZGVzKCd1c3VhcmlvL2FsdGVyYXJfZGFkb3MuanNmJylcbiAgICApXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBJbnZhbGlkIHByZSBwYWdlIGF0IGNoYW5nZSBwYXNzd29yZC4nKTtcblxuICAgIGNvbnN0IHByZUZvcm1FbGVtZW50ID0gcHJlUGFnZS4kKCdmb3JtW25hbWU9XCJmb3JtXCJdJyk7XG5cbiAgICBjb25zdCBwcmVBY3Rpb24gPSBwcmVGb3JtRWxlbWVudC5hdHRyKCdhY3Rpb24nKTtcbiAgICBpZiAoIXByZUFjdGlvbilcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1NJR0FBOiBGb3JtIHdpdGhvdXQgYWN0aW9uIGF0IGNoYW5nZSBwYXNzd29yZCBwcmUgcGFnZS4nXG4gICAgICApO1xuXG4gICAgY29uc3QgcHJlQWN0aW9uVXJsID0gbmV3IFVSTChwcmVBY3Rpb24sIHByZVBhZ2UudXJsLmhyZWYpO1xuXG4gICAgY29uc3QgcHJlUG9zdFZhbHVlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuXG4gICAgY29uc3QgcHJlSW5wdXRzID0gcHJlRm9ybUVsZW1lbnRcbiAgICAgIC5maW5kKFwiaW5wdXRbbmFtZV06bm90KFt0eXBlPSdzdWJtaXQnXSlcIilcbiAgICAgIC50b0FycmF5KCk7XG4gICAgZm9yIChjb25zdCBpbnB1dCBvZiBwcmVJbnB1dHMpIHtcbiAgICAgIGNvbnN0IG5hbWUgPSBwcmVQYWdlLiQoaW5wdXQpLmF0dHIoJ25hbWUnKTtcbiAgICAgIGlmIChuYW1lKSB7XG4gICAgICAgIHByZVBvc3RWYWx1ZXNbbmFtZV0gPSBwcmVQYWdlLiQoaW5wdXQpLnZhbCgpO1xuICAgICAgfVxuICAgIH1cbiAgICBwcmVQb3N0VmFsdWVzWydmb3JtOmFsdGVyYXJTZW5oYSddID0gJ2Zvcm06YWx0ZXJhclNlbmhhJztcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5odHRwLnBvc3QocHJlQWN0aW9uVXJsLmhyZWYsIHByZVBvc3RWYWx1ZXMpO1xuICAgIGNvbnN0IGZvcm1FbGVtZW50ID0gcGFnZS4kKCdmb3JtW25hbWU9XCJmb3JtXCJdJyk7XG5cbiAgICBjb25zdCBhY3Rpb24gPSBmb3JtRWxlbWVudC5hdHRyKCdhY3Rpb24nKTtcbiAgICBpZiAoIWFjdGlvbilcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEZvcm0gd2l0aG91dCBhY3Rpb24gYXQgY2hhbmdlIHBhc3N3b3JkIHBhZ2UuJyk7XG4gICAgY29uc3QgZm9ybUFjdGlvbiA9IG5ldyBVUkwoYWN0aW9uLCBwYWdlLnVybC5ocmVmKTtcblxuICAgIGNvbnN0IHBvc3RWYWx1ZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4gPSB7fTtcbiAgICBjb25zdCBpbnB1dHMgPSBmb3JtRWxlbWVudFxuICAgICAgLmZpbmQoXCJpbnB1dFtuYW1lXTpub3QoW3R5cGU9J3N1Ym1pdCddKVwiKVxuICAgICAgLnRvQXJyYXkoKTtcbiAgICBmb3IgKGNvbnN0IGlucHV0IG9mIGlucHV0cykge1xuICAgICAgY29uc3QgbmFtZSA9IHBhZ2UuJChpbnB1dCkuYXR0cignbmFtZScpO1xuICAgICAgaWYgKG5hbWUpIHtcbiAgICAgICAgcG9zdFZhbHVlc1tuYW1lXSA9IHByZVBhZ2UuJChpbnB1dCkudmFsKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcG9zdFZhbHVlc1snZm9ybTpzZW5oYUF0dWFsJ10gPSBvbGRQYXNzd29yZDtcbiAgICBwb3N0VmFsdWVzWydmb3JtOm5vdmFTZW5oYSddID0gbmV3UGFzc3dvcmQ7XG4gICAgcG9zdFZhbHVlc1snZm9ybTpyZXBldG5Ob3ZhU2VuaGEnXSA9IG5ld1Bhc3N3b3JkO1xuICAgIHBvc3RWYWx1ZXNbJ2Zvcm06YWx0ZXJhckRhZG9zJ10gPSAnQWx0ZXJhciBEYWRvcyc7XG5cbiAgICBjb25zdCByZXN1bHRQYWdlID0gYXdhaXQgdGhpcy5odHRwLnBvc3QoZm9ybUFjdGlvbi5ocmVmLCBwb3N0VmFsdWVzKTtcblxuICAgIGlmIChyZXN1bHRQYWdlLnN0YXR1c0NvZGUgPT09IDIwMCkge1xuICAgICAgY29uc3QgZXJyb3JNc2cgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcbiAgICAgICAgcmVzdWx0UGFnZS4kKCcuZXJyb3MgbGknKS5odG1sKClcbiAgICAgICk7XG4gICAgICBpZiAoZXJyb3JNc2cuaW5jbHVkZXMoJ0Egc2VuaGEgZGlnaXRhZGEgw6kgbXVpdG8gc2ltcGxlcy4nKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcy5lcnJvckluc3VmZmljaWVudFBhc3N3b3JkQ29tcGxleGl0eSk7XG4gICAgICB9XG4gICAgICBpZiAoZXJyb3JNc2cuaW5jbHVkZXMoJ1NlbmhhIEF0dWFsIGRpZ2l0YWRhIG7Do28gY29uZmVyZScpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcih0aGlzLmVycm9ySW52YWxpZENyZWRlbnRpYWxzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocmVzdWx0UGFnZS5zdGF0dXNDb2RlICE9PSAzMDIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1NJR0FBOiBUaGUgY2hhbmdlIHBhc3N3b3JkIHBhZ2Ugc3RhdHVzIGNvZGUgaXMgZGlmZmVyZW50IHRoYW4gZXhwZWN0ZWQuJ1xuICAgICAgKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==