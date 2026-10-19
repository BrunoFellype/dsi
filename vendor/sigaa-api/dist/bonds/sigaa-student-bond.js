"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaStudentBond = void 0;

require("source-map-support/register");

var _url = require("url");

var _sigaaDebug = require("../helpers/sigaa-debug");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Class to represent student bond.
 * @category Internal
 */
class SigaaStudentBond {
  constructor(http, parser, courseFactory, activityFactory, program, registration, bondSwitchUrl) {
    this.http = http;
    this.parser = parser;
    this.courseFactory = courseFactory;
    this.activityFactory = activityFactory;
    this.program = program;
    this.registration = registration;
    this.bondSwitchUrl = bondSwitchUrl;

    _defineProperty(this, "type", 'student');

    _defineProperty(this, "_currentPeriod", void 0);
  }

  /**
   * Get courses, in IFSC it is called "Turmas Virtuais".
   * @param allPeriods if true, all courses will be returned; otherwise, only latest courses.
   * @returns Promise with array of courses.
   */
  async getCourses(allPeriods = false) {
    const coursesPage = await this.http.get('/sigaa/portais/discente/turmas.jsf');
    const table = coursesPage.$('.listagem');

    if (table.length === 0) {
      (0, _sigaaDebug.saveDebugPage)('turmas', coursesPage);
      return [];
    }

    const listCourses = [];
    const rows = table.find('tbody > tr').toArray();
    /* 
       If allPeriods is true then only the last period is
       returned, therefore we need to find out what the 
       value of the last period is, since different 
       versions of SIGAA can have different ordering we 
       can't get the last or first period in the table,
       we need to find out which is the newest regardless
       of table order.
    */

    let periodFilter = null;

    if (!allPeriods) {
      for (let i = 0; i < rows.length; i++) {
        const cellElements = coursesPage.$(rows[i]).find('td');

        if (cellElements.eq(0).hasClass('periodo')) {
          const currentPeriod = this.parser.removeTagsHtml(cellElements.eq(0).html());

          if (periodFilter == null) {
            periodFilter = currentPeriod;
          } else if ([currentPeriod, periodFilter].sort()[1] == currentPeriod) {
            //Check alphabetically if the currentPeriod is the oldest
            periodFilter = currentPeriod;
          } else {
            //If the periodFilter is already the newest, we don't need to look for a newest one.
            break;
          }
        }
      }
    }

    const tableColumnIndexs = {
      title: null,
      class: null,
      schedule: null,
      numberOfStudents: null,
      button: null
    }; // Newer SIGAA versions use <th> in the header

    const tableHeaderCellElements = table.find('thead > tr').first().children('td, th').toArray();

    for (let column = 0; column < tableHeaderCellElements.length; column++) {
      const cellContent = this.parser.removeTagsHtml(coursesPage.$(tableHeaderCellElements[column]).html());

      switch (cellContent) {
        case 'Disciplina':
        case 'Componente Curricular':
          tableColumnIndexs.title = column;
          break;

        case 'Turma':
          tableColumnIndexs.class = column;
          break;

        case 'Horário':
          tableColumnIndexs.schedule = column;
          break;

        case 'Alunos':
          tableColumnIndexs.numberOfStudents = column;
          break;

        case '':
          if (tableColumnIndexs.button == null) tableColumnIndexs.button = column;
          break;
      }
    } // Fallback: the button column is the one with the course link


    for (const row of rows) {
      const cells = coursesPage.$(row).children('td');
      const column = cells.toArray().findIndex(cell => coursesPage.$(cell).find('a[onclick]').length > 0);

      if (column >= 0) {
        tableColumnIndexs.button = column;
        break;
      }
    }

    if (tableColumnIndexs.button == null || tableColumnIndexs.title == null || tableColumnIndexs.schedule == null) {
      (0, _sigaaDebug.saveDebugPage)('turmas', coursesPage);
    }

    if (tableColumnIndexs.button == null) {
      throw new Error('SIGAA: Invalid courses table, could not find the column with class buttons.');
    }

    if (tableColumnIndexs.title == null) {
      throw new Error('SIGAA: Invalid courses table, could not find the column with class titles.');
    }

    if (tableColumnIndexs.schedule == null) {
      throw new Error('SIGAA: Invalid courses table, could not find the column with class schedules.');
    }

    let period;

    for (const row of rows) {
      const cellElements = coursesPage.$(row).find('td');

      if (cellElements.eq(0).hasClass('periodo')) {
        period = this.parser.removeTagsHtml(cellElements.html());
      } else if (period && (!periodFilter || periodFilter == period)) {
        const fullname = this.parser.removeTagsHtml(cellElements.eq(tableColumnIndexs.title).html());
        const [code, ...titleSlices] = fullname.split(' - ');
        const title = titleSlices.join(' - ');
        const buttonCoursePage = cellElements.eq(tableColumnIndexs.button).find('a[onclick]');
        const buttonOnClickCode = buttonCoursePage.attr('onclick');
        if (!buttonOnClickCode) throw new Error('SIGAA: Courses table without course button.');
        const form = coursesPage.parseJSFCLJS(buttonOnClickCode);
        let numberOfStudents = 0;

        if (tableColumnIndexs.numberOfStudents !== null) {
          numberOfStudents = Number(this.parser.removeTagsHtml(cellElements.eq(tableColumnIndexs.numberOfStudents).html()));
        }

        const schedule = this.parser.removeTagsHtml(cellElements.eq(tableColumnIndexs.schedule).html());
        const idKey = Object.keys(form.postValues).find(key => /^(idTurma|turmaId|id)$|idTurma/i.test(key));
        const id = idKey ? form.postValues[idKey] : undefined;

        if (!id) {
          (0, _sigaaDebug.saveDebugPage)('turmas', coursesPage);
          throw new Error(`SIGAA: Course ID not found. Course link fields: ${Object.keys(form.postValues).join(', ')}`);
        }

        const courseData = {
          title,
          code,
          schedule,
          numberOfStudents,
          period,
          id,
          form
        };
        listCourses.push(this.courseFactory.createCourseStudent(courseData));
      }
    }

    return listCourses;
  }
  /**
   * Opens the student portal through the "Menu Discente" link,
   * some institutions (e.g. UFRPE) reject direct access to discente.jsf.
   */


  async getPortalPage() {
    return this.http.followAllRedirect(await this.http.get('/sigaa/verPortalDiscente.do'));
  }

  async getActivities() {
    const frontPage = await this.getPortalPage();
    const table = frontPage.$('#avaliacao-portal > table');
    const rows = table.find('tbody > tr').toArray();
    if (rows.length === 0) (0, _sigaaDebug.saveDebugPage)('portal-atividades', frontPage);
    const listActivities = [];

    for (const row of rows) {
      const cellElements = frontPage.$(row).find('td'); // Skips rows like "Não há atividades cadastradas" or section headers

      if (cellElements.length < 3) continue;
      const dateCellContent = this.parser.removeTagsHtml(cellElements.eq(1).html());
      let date;

      try {
        date = this.parser.parseDates(dateCellContent, 1)[0];
      } catch (err) {
        continue;
      }

      if (!date) continue;
      const done = cellElements.eq(0).find('img').attr('src') === '/sigaa/img/check.png' || date.valueOf() < Date.now();
      const infoTextLines = this.parser.removeTagsHtml(cellElements.eq(2).find('small').html()).split('\n').map(line => line.trim()).filter(line => line);
      if (infoTextLines.length < 2) continue;
      const courseTitle = infoTextLines[0];
      const [type, ...activityTitleSlices] = infoTextLines[1].split(': ');
      const activityTitle = activityTitleSlices.join(': ');

      if (type === 'Questionário' || type === 'Tarefa') {
        const JSFCLJS = cellElements.eq(2).find('small a[onclick]').attr('onclick');
        if (!JSFCLJS) throw new Error('SIGAA: Activity without link.');
        const form = frontPage.parseJSFCLJS(JSFCLJS);

        if (type === 'Questionário') {
          listActivities.push(this.activityFactory.createActivityQuiz({
            courseTitle,
            quizTitle: activityTitle,
            id: form.postValues.id,
            form,
            done,
            date
          }, this));
        } else {
          listActivities.push(this.activityFactory.createActivityHomework({
            courseTitle,
            homeworkTitle: activityTitle,
            form,
            done,
            date
          }, this));
        }
      } else if (type === 'Avaliação') {
        listActivities.push(this.activityFactory.createActivityExam({
          courseTitle,
          examDescription: activityTitle,
          done,
          date
        }, this));
      }
    }

    return listActivities;
  }

  async getCurrentPeriod() {
    if (this._currentPeriod) return this._currentPeriod;
    const frontPage = await this.getPortalPage();
    const period = frontPage.$('#info-usuario > p.periodo-atual > strong').text();
    this._currentPeriod = period;
    return period;
  }

  async getAcademicIndices() {
    const frontPage = await this.getPortalPage();
    const indices = []; // The indices are rendered as pairs of cells: <acronym title="Name">CODE:</acronym> | value

    const cells = frontPage.$('#agenda-docente td').toArray();

    for (let i = 0; i < cells.length - 1; i++) {
      var _cell$find$attr;

      const cell = frontPage.$(cells[i]);
      const label = this.parser.removeTagsHtml(cell.html());
      const codeMatch = label.match(/^([A-Z]{2,5}):?$/);
      if (!codeMatch) continue;
      const valueText = this.parser.removeTagsHtml(frontPage.$(cells[i + 1]).html()).replace(',', '.');
      if (!/^-?\d+(\.\d+)?$/.test(valueText)) continue;
      const code = codeMatch[1];
      if (indices.some(index => index.code === code)) continue;
      const name = ((_cell$find$attr = cell.find('acronym[title], abbr[title]').attr('title')) === null || _cell$find$attr === void 0 ? void 0 : _cell$find$attr.trim()) || code;
      indices.push({
        code,
        name,
        value: Number(valueText)
      });
      i++;
    }

    if (indices.length === 0) (0, _sigaaDebug.saveDebugPage)('portal-indices', frontPage);
    return indices;
  }
  /**
   * Opens the report "Consultar Minhas Notas" through the student menu.
   * The menu item is a JSCookMenu action, so we post the menu form with
   * the action found in the page scripts.
   */


  async getGradesReportPage() {
    const portalPage = await this.getPortalPage();
    const actionMatch = portalPage.bodyDecoded.match(/['"]([^'"]*:A\]#\{\s*relatorioNotasAluno\.gerarRelatorio\s*\})['"]/);
    const formElement = portalPage.$('input[name="jscook_action"]').closest('form');
    const formAction = formElement.attr('action');

    if (!actionMatch || !formAction) {
      (0, _sigaaDebug.saveDebugPage)('portal-menu', portalPage);
      throw new Error('SIGAA: Menu item "Consultar Minhas Notas" not found.');
    }

    const postValues = {};
    formElement.find('input[name]').each((_, element) => {
      const name = portalPage.$(element).attr('name');
      if (name) postValues[name] = portalPage.$(element).val() || '';
    });
    postValues['jscook_action'] = actionMatch[1];
    const action = new _url.URL(formAction, portalPage.url);
    return this.http.followAllRedirect(await this.http.post(action.href, postValues, {
      noCache: true
    }));
  }

  async getGradesHistory() {
    const page = await this.getGradesReportPage();
    const tables = page.$('table.tabelaRelatorio').toArray();

    if (tables.length === 0) {
      (0, _sigaaDebug.saveDebugPage)('minhas-notas', page);
      throw new Error('SIGAA: Grades report without tables.');
    }

    const parseNumber = text => {
      const value = parseFloat(text.replace(',', '.'));
      return isNaN(value) ? undefined : value;
    };

    const normalize = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    const history = [];

    for (const table of tables) {
      const period = this.parser.removeTagsHtml(page.$(table).find('caption').html());
      const headers = page.$(table).find('thead tr').last().children('th, td').toArray().map(cell => this.parser.removeTagsHtml(page.$(cell).html()));
      const rows = page.$(table).find('tbody tr').toArray();

      for (const row of rows) {
        const cells = page.$(row).children('td').toArray();
        if (cells.length < 2) continue;
        const raw = {};
        cells.forEach((cell, index) => {
          const header = headers[index] || `Coluna ${index + 1}`;
          raw[header] = this.parser.removeTagsHtml(page.$(cell).html());
        });
        const course = {
          period,
          code: '',
          title: '',
          grades: [],
          raw
        };

        for (const [header, value] of Object.entries(raw)) {
          const key = normalize(header);

          if (key === 'codigo') {
            course.code = value;
          } else if (key === 'disciplina' || key === 'componente curricular' || key === 'componente') {
            // Some versions show "CODE - TITLE" in the same cell
            const [code, ...title] = value.split(' - ');

            if (!course.code && title.length > 0) {
              course.code = code;
              course.title = title.join(' - ');
            } else {
              course.title = value;
            }
          } else if (/^(resultado|media|media final|nota final)$/.test(key)) {
            course.finalGrade = parseNumber(value);
          } else if (key === 'faltas') {
            course.absences = parseNumber(value);
          } else if (/^(situacao|sit\.?)$/.test(key)) {
            course.situation = value;
          } else if (/^(unid|nota|rec|av)/.test(key)) {
            course.grades.push({
              name: header,
              value: parseNumber(value)
            });
          }
        }

        if (course.code || course.title) history.push(course);
      }
    }

    return history;
  }

}

exports.SigaaStudentBond = SigaaStudentBond;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ib25kcy9zaWdhYS1zdHVkZW50LWJvbmQudHMiXSwibmFtZXMiOlsiU2lnYWFTdHVkZW50Qm9uZCIsImNvbnN0cnVjdG9yIiwiaHR0cCIsInBhcnNlciIsImNvdXJzZUZhY3RvcnkiLCJhY3Rpdml0eUZhY3RvcnkiLCJwcm9ncmFtIiwicmVnaXN0cmF0aW9uIiwiYm9uZFN3aXRjaFVybCIsImdldENvdXJzZXMiLCJhbGxQZXJpb2RzIiwiY291cnNlc1BhZ2UiLCJnZXQiLCJ0YWJsZSIsIiQiLCJsZW5ndGgiLCJsaXN0Q291cnNlcyIsInJvd3MiLCJmaW5kIiwidG9BcnJheSIsInBlcmlvZEZpbHRlciIsImkiLCJjZWxsRWxlbWVudHMiLCJlcSIsImhhc0NsYXNzIiwiY3VycmVudFBlcmlvZCIsInJlbW92ZVRhZ3NIdG1sIiwiaHRtbCIsInNvcnQiLCJ0YWJsZUNvbHVtbkluZGV4cyIsInRpdGxlIiwiY2xhc3MiLCJzY2hlZHVsZSIsIm51bWJlck9mU3R1ZGVudHMiLCJidXR0b24iLCJ0YWJsZUhlYWRlckNlbGxFbGVtZW50cyIsImZpcnN0IiwiY2hpbGRyZW4iLCJjb2x1bW4iLCJjZWxsQ29udGVudCIsInJvdyIsImNlbGxzIiwiZmluZEluZGV4IiwiY2VsbCIsIkVycm9yIiwicGVyaW9kIiwiZnVsbG5hbWUiLCJjb2RlIiwidGl0bGVTbGljZXMiLCJzcGxpdCIsImpvaW4iLCJidXR0b25Db3Vyc2VQYWdlIiwiYnV0dG9uT25DbGlja0NvZGUiLCJhdHRyIiwiZm9ybSIsInBhcnNlSlNGQ0xKUyIsIk51bWJlciIsImlkS2V5IiwiT2JqZWN0Iiwia2V5cyIsInBvc3RWYWx1ZXMiLCJrZXkiLCJ0ZXN0IiwiaWQiLCJ1bmRlZmluZWQiLCJjb3Vyc2VEYXRhIiwicHVzaCIsImNyZWF0ZUNvdXJzZVN0dWRlbnQiLCJnZXRQb3J0YWxQYWdlIiwiZm9sbG93QWxsUmVkaXJlY3QiLCJnZXRBY3Rpdml0aWVzIiwiZnJvbnRQYWdlIiwibGlzdEFjdGl2aXRpZXMiLCJkYXRlQ2VsbENvbnRlbnQiLCJkYXRlIiwicGFyc2VEYXRlcyIsImVyciIsImRvbmUiLCJ2YWx1ZU9mIiwiRGF0ZSIsIm5vdyIsImluZm9UZXh0TGluZXMiLCJtYXAiLCJsaW5lIiwidHJpbSIsImZpbHRlciIsImNvdXJzZVRpdGxlIiwidHlwZSIsImFjdGl2aXR5VGl0bGVTbGljZXMiLCJhY3Rpdml0eVRpdGxlIiwiSlNGQ0xKUyIsImNyZWF0ZUFjdGl2aXR5UXVpeiIsInF1aXpUaXRsZSIsImNyZWF0ZUFjdGl2aXR5SG9tZXdvcmsiLCJob21ld29ya1RpdGxlIiwiY3JlYXRlQWN0aXZpdHlFeGFtIiwiZXhhbURlc2NyaXB0aW9uIiwiZ2V0Q3VycmVudFBlcmlvZCIsIl9jdXJyZW50UGVyaW9kIiwidGV4dCIsImdldEFjYWRlbWljSW5kaWNlcyIsImluZGljZXMiLCJsYWJlbCIsImNvZGVNYXRjaCIsIm1hdGNoIiwidmFsdWVUZXh0IiwicmVwbGFjZSIsInNvbWUiLCJpbmRleCIsIm5hbWUiLCJ2YWx1ZSIsImdldEdyYWRlc1JlcG9ydFBhZ2UiLCJwb3J0YWxQYWdlIiwiYWN0aW9uTWF0Y2giLCJib2R5RGVjb2RlZCIsImZvcm1FbGVtZW50IiwiY2xvc2VzdCIsImZvcm1BY3Rpb24iLCJlYWNoIiwiXyIsImVsZW1lbnQiLCJ2YWwiLCJhY3Rpb24iLCJVUkwiLCJ1cmwiLCJwb3N0IiwiaHJlZiIsIm5vQ2FjaGUiLCJnZXRHcmFkZXNIaXN0b3J5IiwicGFnZSIsInRhYmxlcyIsInBhcnNlTnVtYmVyIiwicGFyc2VGbG9hdCIsImlzTmFOIiwibm9ybWFsaXplIiwidG9Mb3dlckNhc2UiLCJoaXN0b3J5IiwiaGVhZGVycyIsImxhc3QiLCJyYXciLCJmb3JFYWNoIiwiaGVhZGVyIiwiY291cnNlIiwiZ3JhZGVzIiwiZW50cmllcyIsImZpbmFsR3JhZGUiLCJhYnNlbmNlcyIsInNpdHVhdGlvbiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBR0E7O0FBUUE7Ozs7QUE0RkE7QUFDQTtBQUNBO0FB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LDZDQUE2Q2hELElBQTdDLENBQWtERCxHQUFsRCxDQUFKLEVBQTREO0FBQ2pFaUYsWUFBQUEsTUFBTSxDQUFDRyxVQUFQLEdBQW9CZCxXQUFXLENBQUNyQixLQUFELENBQS9CO0FBQ0QsV0FGTSxNQUVBLElBQUlqRCxHQUFHLEtBQUssUUFBWixFQUFzQjtBQUMzQmlGLFlBQUFBLE1BQU0sQ0FBQ0ksUUFBUCxHQUFrQmYsV0FBVyxDQUFDckIsS0FBRCxDQUE3QjtBQUNELFdBRk0sTUFFQSxJQUFJLHNCQUFzQmhELElBQXRCLENBQTJCRCxHQUEzQixDQUFKLEVBQXFDO0FBQzFDaUYsWUFBQUEsTUFBTSxDQUFDSyxTQUFQLEdBQW1CckMsS0FBbkI7QUFDRCxXQUZNLE1BRUEsSUFBSSxzQkFBc0JoRCxJQUF0QixDQUEyQkQsR0FBM0IsQ0FBSixFQUFxQztBQUMxQ2lGLFlBQUFBLE1BQU0sQ0FBQ0MsTUFBUCxDQUFjN0UsSUFBZCxDQUFtQjtBQUFFMkMsY0FBQUEsSUFBSSxFQUFFZ0MsTUFBUjtBQUFnQi9CLGNBQUFBLEtBQUssRUFBRXFCLFdBQVcsQ0FBQ3JCLEtBQUQ7QUFBbEMsYUFBbkI7QUFDRDtBQUNGOztBQUNELFlBQUlnQyxNQUFNLENBQUMvRixJQUFQLElBQWUrRixNQUFNLENBQUNoSCxLQUExQixFQUFpQzBHLE9BQU8sQ0FBQ3RFLElBQVIsQ0FBYTRFLE1BQWI7QUFDbEM7QUFDRjs7QUFDRCxXQUFPTixPQUFQO0FBQ0Q7O0FBNWJrRCIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvdXJzZUZhY3RvcnkgfSBmcm9tICdAY291cnNlcy9zaWdhYS1jb3Vyc2Utc3R1ZGVudC1mYWN0b3J5JztcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gJ0BoZWxwZXJzL3NpZ2FhLXBhcnNlcic7XG5pbXBvcnQgeyBIVFRQIH0gZnJvbSAnQHNlc3Npb24vc2lnYWEtaHR0cCc7XG5pbXBvcnQgeyBVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHtcbiAgQ291cnNlU3R1ZGVudCxcbiAgQ291cnNlU3R1ZGVudERhdGFcbn0gZnJvbSAnQGNvdXJzZXMvc2lnYWEtY291cnNlLXN0dWRlbnQnO1xuaW1wb3J0IHsgSG9tZXdvcmsgfSBmcm9tICdAYXR0YWNobWVudHMvc2lnYWEtaG9tZXdvcmstc3R1ZGVudCc7XG5pbXBvcnQgeyBFeGFtIH0gZnJvbSAnQGNvdXJzZVJlc291cmNlcy9zaWdhYS1leGFtLXN0dWRlbnQnO1xuaW1wb3J0IHsgQWN0aXZpdHksIEFjdGl2aXR5RmFjdG9yeSB9IGZyb20gJ0BhY3Rpdml0eS9zaWdhYS1hY3Rpdml0eS1mYWN0b3J5JztcbmltcG9ydCB7IHNhdmVEZWJ1Z1BhZ2UgfSBmcm9tICdAaGVscGVycy9zaWdhYS1kZWJ1Zyc7XG5pbXBvcnQgeyBQYWdlIH0gZnJvbSAnQHNlc3Npb24vc2lnYWEtcGFnZSc7XG5cbi8qKlxuICogQWJzdHJhY3Rpb24gdG8gcmVwcmVzZW50IGEgc3R1ZGVudCBib25kLlxuICogQGNhdGVnb3J5IFB1YmxpY1xuICovXG5leHBvcnQgaW50ZXJmYWNlIFN0dWRlbnRCb25kIHtcbiAgcmVhZG9ubHkgdHlwZTogJ3N0dWRlbnQnO1xuICAvKipcbiAgICogSXQncyB0aGUgbmFtZSBvZiB0aGUgc3R1ZGVudCBwcm9ncmFtLCBpbiBJRlNDIGl0IGlzIGNhbGxlZCBcImN1cnNvXCIuXG4gICAqL1xuICByZWFkb25seSBwcm9ncmFtOiBzdHJpbmc7XG4gIC8qKlxuICAgKiBJdCBpcyB0aGUgc3R1ZGVudCByZWdpc3RyYXRpb24gY29kZSwgaW4gSUZTQyBpdCBpcyBjYWxsZWQgXCJtYXRyw61jdWxhXCIuXG4gICAqL1xuICByZWFkb25seSByZWdpc3RyYXRpb246IHN0cmluZztcbiAgLyoqXG4gICAqIEdldCBjb3Vyc2VzLCBpbiBJRlNDIGl0IGlzIGNhbGxlZCBcIlR1cm1hcyBWaXJ0dWFpc1wiLlxuICAgKiBAcGFyYW0gYWxsUGVyaW9kcyBpZiB0cnVlLCBhbGwgY291cnNlcyB3aWxsIGJlIHJldHVybmVkOyBvdGhlcndpc2UsIG9ubHkgY3VycmVudCBjb3Vyc2VzLlxuICAgKiBAcmV0dXJucyBQcm9taXNlIHdpdGggYXJyYXkgb2YgY291cnNlcy5cbiAgICovXG4gIGdldENvdXJzZXMoYWxsUGVyaW9kcz86IGJvb2xlYW4pOiBQcm9taXNlPENvdXJzZVN0dWRlbnRbXT47XG5cbiAgZ2V0QWN0aXZpdGllcygpOiBQcm9taXNlPEFjdGl2aXR5W10+O1xuXG4gIGdldEN1cnJlbnRQZXJpb2QoKTogUHJvbWlzZTxzdHJpbmc+O1xuXG4gIC8qKlxuICAgKiBHZXQgYWNhZGVtaWMgaW5kaWNlcyBzaG93biBvbiB0aGUgc3R1ZGVudCBwb3J0YWwgKFwiw41uZGljZXMgQWNhZMOqbWljb3NcIiksXG4gICAqIGUuZy4gTUMsIElSQSwgTUNOLCBJRUNILCBJRVBMLCBJRUEsIElFQU4sIElERSwgSUVQLlxuICAgKi9cbiAgZ2V0QWNhZGVtaWNJbmRpY2VzKCk6IFByb21pc2U8QWNhZGVtaWNJbmRleFtdPjtcblxuICAvKipcbiAgICogR2V0IHRoZSBncmFkZXMgb2YgZXZlcnkgY291cnNlIGFscmVhZHkgdGFrZW4sIGZyb20gdGhlIHJlcG9ydFxuICAgKiBcIkNvbnN1bHRhciBNaW5oYXMgTm90YXNcIiBvZiB0aGUgc3R1ZGVudCBtZW51IChhbGwgcGVyaW9kcyBpbiBvbmUgcGFnZSkuXG4gICAqL1xuICBnZXRHcmFkZXNIaXN0b3J5KCk6IFByb21pc2U8Q291cnNlR3JhZGVzSGlzdG9yeVtdPjtcbn1cblxuLyoqXG4gKiBHcmFkZXMgb2YgYSBjb3Vyc2UgaW4gdGhlIHJlcG9ydCBcIkNvbnN1bHRhciBNaW5oYXMgTm90YXNcIi5cbiAqIEBjYXRlZ29yeSBQdWJsaWNcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb3Vyc2VHcmFkZXNIaXN0b3J5IHtcbiAgLyoqIFBlcmlvZCwgZS5nLiBcIjIwMjUuMVwiLiAqL1xuICBwZXJpb2Q6IHN0cmluZztcbiAgLyoqIENvdXJzZSBjb2RlLCBlLmcuIFwiMTQzNzlcIi4gKi9cbiAgY29kZTogc3RyaW5nO1xuICAvKiogQ291cnNlIHRpdGxlLiAqL1xuICB0aXRsZTogc3RyaW5nO1xuICAvKiogVW5pdCBncmFkZXMsIGUuZy4gW3sgbmFtZTogJ1VuaWQuIDEnLCB2YWx1ZTogOC41IH1dLiAqL1xuICBncmFkZXM6IHsgbmFtZTogc3RyaW5nOyB2YWx1ZT86IG51bWJlciB9W107XG4gIC8qKiBGaW5hbCBncmFkZSAoXCJSZXN1bHRhZG9cIiAvIFwiTcOpZGlhXCIpLCB1bmRlZmluZWQgaWYgbm90IHJlbGVhc2VkLiAqL1xuICBmaW5hbEdyYWRlPzogbnVtYmVyO1xuICAvKiogTnVtYmVyIG9mIGFic2VuY2VzLiAqL1xuICBhYnNlbmNlcz86IG51bWJlcjtcbiAgLyoqIFNpdHVhdGlvbiwgZS5nLiBcIkFQUk9WQURPXCIsIFwiUkVQUk9WQURPXCIsIFwiTUFUUklDVUxBRE9cIi4gKi9cbiAgc2l0dWF0aW9uPzogc3RyaW5nO1xuICAvKiogQWxsIGNvbHVtbnMgb2YgdGhlIHJvdyBhcyBzaG93biBvbiB0aGUgcGFnZS4gKi9cbiAgcmF3OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG4vKipcbiAqIEFjYWRlbWljIGluZGV4IG9mIHRoZSBzdHVkZW50LCBpbiBQb3J0dWd1ZXNlIGl0IGlzIGNhbGxlZCBcIsONbmRpY2UgQWNhZMOqbWljb1wiLlxuICogQGNhdGVnb3J5IFB1YmxpY1xuICovXG5leHBvcnQgaW50ZXJmYWNlIEFjYWRlbWljSW5kZXgge1xuICAvKiogQWNyb255bSwgZS5nLiBcIk1DXCIgb3IgXCJJUkFcIi4gKi9cbiAgY29kZTogc3RyaW5nO1xuICAvKiogRnVsbCBuYW1lIHdoZW4gdGhlIHBhZ2UgcHJvdmlkZXMgaXQsIGUuZy4gXCJNw6lkaWEgZGUgQ29uY2x1c8Ojb1wiLiAqL1xuICBuYW1lOiBzdHJpbmc7XG4gIHZhbHVlOiBudW1iZXI7XG59XG5leHBvcnQgaW50ZXJmYWNlIEFjdGl2aXR5VHlwZUhvbWV3b3JrIHtcbiAgdHlwZTogJ2hvbWV3b3JrJztcbiAgY291cnNlOiBDb3Vyc2VTdHVkZW50O1xuICBob21ld29yazogSG9tZXdvcms7XG4gIGRhdGU6IERhdGU7XG4gIGRvbmU6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQWN0aXZpdHlUeXBlRXhlbSB7XG4gIHR5cGU6ICdleGFtJztcbiAgdGl0bGU6IHN0cmluZztcbiAgY291cnNlOiBDb3Vyc2VTdHVkZW50O1xuICBleGVtOiBFeGFtO1xuICBkYXRlOiBEYXRlO1xuICBkb25lOiBib29sZWFuO1xufVxuXG4vKipcbiAqIENsYXNzIHRvIHJlcHJlc2VudCBzdHVkZW50IGJvbmQuXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcbiAqL1xuZXhwb3J0IGNsYXNzIFNpZ2FhU3R1ZGVudEJvbmQgaW1wbGVtZW50cyBTdHVkZW50Qm9uZCB7XG4gIGNvbnN0cnVjdG9yKFxuICAgIHByaXZhdGUgaHR0cDogSFRUUCxcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyLFxuICAgIHByaXZhdGUgY291cnNlRmFjdG9yeTogQ291cnNlRmFjdG9yeSxcbiAgICBwcml2YXRlIGFjdGl2aXR5RmFjdG9yeTogQWN0aXZpdHlGYWN0b3J5LFxuICAgIHJlYWRvbmx5IHByb2dyYW06IHN0cmluZyxcbiAgICByZWFkb25seSByZWdpc3RyYXRpb246IHN0cmluZyxcbiAgICByZWFkb25seSBib25kU3dpdGNoVXJsOiBVUkwgfCBudWxsXG4gICkge31cblxuICByZWFkb25seSB0eXBlID0gJ3N0dWRlbnQnO1xuICBwcml2YXRlIF9jdXJyZW50UGVyaW9kPzogc3RyaW5nO1xuICAvKipcbiAgICogR2V0IGNvdXJzZXMsIGluIElGU0MgaXQgaXMgY2FsbGVkIFwiVHVybWFzIFZpcnR1YWlzXCIuXG4gICAqIEBwYXJhbSBhbGxQZXJpb2RzIGlmIHRydWUsIGFsbCBjb3Vyc2VzIHdpbGwgYmUgcmV0dXJuZWQ7IG90aGVyd2lzZSwgb25seSBsYXRlc3QgY291cnNlcy5cbiAgICogQHJldHVybnMgUHJvbWlzZSB3aXRoIGFycmF5IG9mIGNvdXJzZXMuXG4gICAqL1xuICBhc3luYyBnZXRDb3Vyc2VzKGFsbFBlcmlvZHMgPSBmYWxzZSk6IFByb21pc2U8Q291cnNlU3R1ZGVudFtdPiB7XG4gICAgY29uc3QgY291cnNlc1BhZ2UgPSBhd2FpdCB0aGlzLmh0dHAuZ2V0KFxuICAgICAgJy9zaWdhYS9wb3J0YWlzL2Rpc2NlbnRlL3R1cm1hcy5qc2YnXG4gICAgKTtcblxuICAgIGNvbnN0IHRhYmxlID0gY291cnNlc1BhZ2UuJCgnLmxpc3RhZ2VtJyk7XG4gICAgaWYgKHRhYmxlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgc2F2ZURlYnVnUGFnZSgndHVybWFzJywgY291cnNlc1BhZ2UpO1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICBjb25zdCBsaXN0Q291cnNlczogQ291cnNlU3R1ZGVudFtdID0gW107XG4gICAgY29uc3Qgcm93cyA9IHRhYmxlLmZpbmQoJ3Rib2R5ID4gdHInKS50b0FycmF5KCk7XG5cbiAgICAvKiBcbiAgICAgICBJZiBhbGxQZXJpb2RzIGlzIHRydWUgdGhlbiBvbmx5IHRoZSBsYXN0IHBlcmlvZCBpc1xuICAgICAgIHJldHVybmVkLCB0aGVyZWZvcmUgd2UgbmVlZCB0byBmaW5kIG91dCB3aGF0IHRoZSBcbiAgICAgICB2YWx1ZSBvZiB0aGUgbGFzdCBwZXJpb2QgaXMsIHNpbmNlIGRpZmZlcmVudCBcbiAgICAgICB2ZXJzaW9ucyBvZiBTSUdBQSBjYW4gaGF2ZSBkaWZmZXJlbnQgb3JkZXJpbmcgd2UgXG4gICAgICAgY2FuJ3QgZ2V0IHRoZSBsYXN0IG9yIGZpcnN0IHBlcmlvZCBpbiB0aGUgdGFibGUsXG4gICAgICAgd2UgbmVlZCB0byBmaW5kIG91dCB3aGljaCBpcyB0aGUgbmV3ZXN0IHJlZ2FyZGxlc3NcbiAgICAgICBvZiB0YWJsZSBvcmRlci5cbiAgICAqL1xuICAgIGxldCBwZXJpb2RGaWx0ZXI6IG51bGwgfCBzdHJpbmcgPSBudWxsO1xuICAgIGlmICghYWxsUGVyaW9kcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCByb3dzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGNlbGxFbGVtZW50cyA9IGNvdXJzZXNQYWdlLiQocm93c1tpXSkuZmluZCgndGQnKTtcbiAgICAgICAgaWYgKGNlbGxFbGVtZW50cy5lcSgwKS5oYXNDbGFzcygncGVyaW9kbycpKSB7XG4gICAgICAgICAgY29uc3QgY3VycmVudFBlcmlvZCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxuICAgICAgICAgICAgY2VsbEVsZW1lbnRzLmVxKDApLmh0bWwoKVxuICAgICAgICAgICk7XG4gICAgICAgICAgaWYgKHBlcmlvZEZpbHRlciA9PSBudWxsKSB7XG4gICAgICAgICAgICBwZXJpb2RGaWx0ZXIgPSBjdXJyZW50UGVyaW9kO1xuICAgICAgICAgIH0gZWxzZSBpZiAoW2N1cnJlbnRQZXJpb2QsIHBlcmlvZEZpbHRlcl0uc29ydCgpWzFdID09IGN1cnJlbnRQZXJpb2QpIHtcbiAgICAgICAgICAgIC8vQ2hlY2sgYWxwaGFiZXRpY2FsbHkgaWYgdGhlIGN1cnJlbnRQZXJpb2QgaXMgdGhlIG9sZGVzdFxuICAgICAgICAgICAgcGVyaW9kRmlsdGVyID0gY3VycmVudFBlcmlvZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy9JZiB0aGUgcGVyaW9kRmlsdGVyIGlzIGFscmVhZHkgdGhlIG5ld2VzdCwgd2UgZG9uJ3QgbmVlZCB0byBsb29rIGZvciBhIG5ld2VzdCBvbmUuXG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCB0YWJsZUNvbHVtbkluZGV4czogUmVjb3JkPHN0cmluZywgbnVsbCB8IG51bWJlcj4gPSB7XG4gICAgICB0aXRsZTogbnVsbCxcbiAgICAgIGNsYXNzOiBudWxsLFxuICAgICAgc2NoZWR1bGU6IG51bGwsXG4gICAgICBudW1iZXJPZlN0dWRlbnRzOiBudWxsLFxuICAgICAgYnV0dG9uOiBudWxsXG4gICAgfTtcblxuICAgIC8vIE5ld2VyIFNJR0FBIHZlcnNpb25zIHVzZSA8dGg+IGluIHRoZSBoZWFkZXJcbiAgICBjb25zdCB0YWJsZUhlYWRlckNlbGxFbGVtZW50cyA9IHRhYmxlXG4gICAgICAuZmluZCgndGhlYWQgPiB0cicpXG4gICAgICAuZmlyc3QoKVxuICAgICAgLmNoaWxkcmVuKCd0ZCwgdGgnKVxuICAgICAgLnRvQXJyYXkoKTtcbiAgICBmb3IgKGxldCBjb2x1bW4gPSAwOyBjb2x1bW4gPCB0YWJsZUhlYWRlckNlbGxFbGVtZW50cy5sZW5ndGg7IGNvbHVtbisrKSB7XG4gICAgICBjb25zdCBjZWxsQ29udGVudCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxuICAgICAgICBjb3Vyc2VzUGFnZS4kKHRhYmxlSGVhZGVyQ2VsbEVsZW1lbnRzW2NvbHVtbl0pLmh0bWwoKVxuICAgICAgKTtcbiAgICAgIHN3aXRjaCAoY2VsbENvbnRlbnQpIHtcbiAgICAgICAgY2FzZSAnRGlzY2lwbGluYSc6XG4gICAgICAgIGNhc2UgJ0NvbXBvbmVudGUgQ3VycmljdWxhcic6XG4gICAgICAgICAgdGFibGVDb2x1bW5JbmRleHMudGl0bGUgPSBjb2x1bW47XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ1R1cm1hJzpcbiAgICAgICAgICB0YWJsZUNvbHVtbkluZGV4cy5jbGFzcyA9IGNvbHVtbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnSG9yw6FyaW8nOlxuICAgICAgICAgIHRhYmxlQ29sdW1uSW5kZXhzLnNjaGVkdWxlID0gY29sdW1uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdBbHVub3MnOlxuICAgICAgICAgIHRhYmxlQ29sdW1uSW5kZXhzLm51bWJlck9mU3R1ZGVudHMgPSBjb2x1bW47XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJyc6XG4gICAgICAgICAgaWYgKHRhYmxlQ29sdW1uSW5kZXhzLmJ1dHRvbiA9PSBudWxsKVxuICAgICAgICAgICAgdGFibGVDb2x1bW5JbmRleHMuYnV0dG9uID0gY29sdW1uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZhbGxiYWNrOiB0aGUgYnV0dG9uIGNvbHVtbiBpcyB0aGUgb25lIHdpdGggdGhlIGNvdXJzZSBsaW5rXG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgY29uc3QgY2VsbHMgPSBjb3Vyc2VzUGFnZS4kKHJvdykuY2hpbGRyZW4oJ3RkJyk7XG4gICAgICBjb25zdCBjb2x1bW4gPSBjZWxsc1xuICAgICAgICAudG9BcnJheSgpXG4gICAgICAgIC5maW5kSW5kZXgoKGNlbGwpID0+IGNvdXJzZXNQYWdlLiQoY2VsbCkuZmluZCgnYVtvbmNsaWNrXScpLmxlbmd0aCA+IDApO1xuICAgICAgaWYgKGNvbHVtbiA+PSAwKSB7XG4gICAgICAgIHRhYmxlQ29sdW1uSW5kZXhzLmJ1dHRvbiA9IGNvbHVtbjtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgdGFibGVDb2x1bW5JbmRleHMuYnV0dG9uID09IG51bGwgfHxcbiAgICAgIHRhYmxlQ29sdW1uSW5kZXhzLnRpdGxlID09IG51bGwgfHxcbiAgICAgIHRhYmxlQ29sdW1uSW5kZXhzLnNjaGVkdWxlID09IG51bGxcbiAgICApIHtcbiAgICAgIHNhdmVEZWJ1Z1BhZ2UoJ3R1cm1hcycsIGNvdXJzZXNQYWdlKTtcbiAgICB9XG5cbiAgICBpZiAodGFibGVDb2x1bW5JbmRleHMuYnV0dG9uID09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgJ1NJR0FBOiBJbnZhbGlkIGNvdXJzZXMgdGFibGUsIGNvdWxkIG5vdCBmaW5kIHRoZSBjb2x1bW4gd2l0aCBjbGFzcyBidXR0b25zLidcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0YWJsZUNvbHVtbkluZGV4cy50aXRsZSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdTSUdBQTogSW52YWxpZCBjb3Vyc2VzIHRhYmxlLCBjb3VsZCBub3QgZmluZCB0aGUgY29sdW1uIHdpdGggY2xhc3MgdGl0bGVzLidcbiAgICAgICk7XG4gICAgfVxuICAgIGlmICh0YWJsZUNvbHVtbkluZGV4cy5zY2hlZHVsZSA9PSBudWxsKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICdTSUdBQTogSW52YWxpZCBjb3Vyc2VzIHRhYmxlLCBjb3VsZCBub3QgZmluZCB0aGUgY29sdW1uIHdpdGggY2xhc3Mgc2NoZWR1bGVzLidcbiAgICAgICk7XG4gICAgfVxuICAgIGxldCBwZXJpb2Q7XG5cbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICBjb25zdCBjZWxsRWxlbWVudHMgPSBjb3Vyc2VzUGFnZS4kKHJvdykuZmluZCgndGQnKTtcbiAgICAgIGlmIChjZWxsRWxlbWVudHMuZXEoMCkuaGFzQ2xhc3MoJ3BlcmlvZG8nKSkge1xuICAgICAgICBwZXJpb2QgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChjZWxsRWxlbWVudHMuaHRtbCgpKTtcbiAgICAgIH0gZWxzZSBpZiAocGVyaW9kICYmICghcGVyaW9kRmlsdGVyIHx8IHBlcmlvZEZpbHRlciA9PSBwZXJpb2QpKSB7XG4gICAgICAgIGNvbnN0IGZ1bGxuYW1lID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXG4gICAgICAgICAgY2VsbEVsZW1lbnRzLmVxKHRhYmxlQ29sdW1uSW5kZXhzLnRpdGxlKS5odG1sKClcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBbY29kZSwgLi4udGl0bGVTbGljZXNdID0gZnVsbG5hbWUuc3BsaXQoJyAtICcpO1xuICAgICAgICBjb25zdCB0aXRsZSA9IHRpdGxlU2xpY2VzLmpvaW4oJyAtICcpO1xuICAgICAgICBjb25zdCBidXR0b25Db3Vyc2VQYWdlID0gY2VsbEVsZW1lbnRzXG4gICAgICAgICAgLmVxKHRhYmxlQ29sdW1uSW5kZXhzLmJ1dHRvbilcbiAgICAgICAgICAuZmluZCgnYVtvbmNsaWNrXScpO1xuXG4gICAgICAgIGNvbnN0IGJ1dHRvbk9uQ2xpY2tDb2RlID0gYnV0dG9uQ291cnNlUGFnZS5hdHRyKCdvbmNsaWNrJyk7XG5cbiAgICAgICAgaWYgKCFidXR0b25PbkNsaWNrQ29kZSlcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBDb3Vyc2VzIHRhYmxlIHdpdGhvdXQgY291cnNlIGJ1dHRvbi4nKTtcblxuICAgICAgICBjb25zdCBmb3JtID0gY291cnNlc1BhZ2UucGFyc2VKU0ZDTEpTKGJ1dHRvbk9uQ2xpY2tDb2RlKTtcblxuICAgICAgICBsZXQgbnVtYmVyT2ZTdHVkZW50cyA9IDA7XG4gICAgICAgIGlmICh0YWJsZUNvbHVtbkluZGV4cy5udW1iZXJPZlN0dWRlbnRzICE9PSBudWxsKSB7XG4gICAgICAgICAgbnVtYmVyT2ZTdHVkZW50cyA9IE51bWJlcihcbiAgICAgICAgICAgIHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxuICAgICAgICAgICAgICBjZWxsRWxlbWVudHMuZXEodGFibGVDb2x1bW5JbmRleHMubnVtYmVyT2ZTdHVkZW50cykuaHRtbCgpXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHNjaGVkdWxlID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXG4gICAgICAgICAgY2VsbEVsZW1lbnRzLmVxKHRhYmxlQ29sdW1uSW5kZXhzLnNjaGVkdWxlKS5odG1sKClcbiAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBpZEtleSA9IE9iamVjdC5rZXlzKGZvcm0ucG9zdFZhbHVlcykuZmluZCgoa2V5KSA9PlxuICAgICAgICAgIC9eKGlkVHVybWF8dHVybWFJZHxpZCkkfGlkVHVybWEvaS50ZXN0KGtleSlcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgaWQgPSBpZEtleSA/IGZvcm0ucG9zdFZhbHVlc1tpZEtleV0gOiB1bmRlZmluZWQ7XG5cbiAgICAgICAgaWYgKCFpZCkge1xuICAgICAgICAgIHNhdmVEZWJ1Z1BhZ2UoJ3R1cm1hcycsIGNvdXJzZXNQYWdlKTtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgU0lHQUE6IENvdXJzZSBJRCBub3QgZm91bmQuIENvdXJzZSBsaW5rIGZpZWxkczogJHtPYmplY3Qua2V5cyhcbiAgICAgICAgICAgICAgZm9ybS5wb3N0VmFsdWVzXG4gICAgICAgICAgICApLmpvaW4oJywgJyl9YFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgY291cnNlRGF0YTogQ291cnNlU3R1ZGVudERhdGEgPSB7XG4gICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgY29kZSxcbiAgICAgICAgICBzY2hlZHVsZSxcbiAgICAgICAgICBudW1iZXJPZlN0dWRlbnRzLFxuICAgICAgICAgIHBlcmlvZCxcbiAgICAgICAgICBpZCxcbiAgICAgICAgICBmb3JtXG4gICAgICAgIH07XG4gICAgICAgIGxpc3RDb3Vyc2VzLnB1c2godGhpcy5jb3Vyc2VGYWN0b3J5LmNyZWF0ZUNvdXJzZVN0dWRlbnQoY291cnNlRGF0YSkpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbGlzdENvdXJzZXM7XG4gIH1cblxuICAvKipcbiAgICogT3BlbnMgdGhlIHN0dWRlbnQgcG9ydGFsIHRocm91Z2ggdGhlIFwiTWVudSBEaXNjZW50ZVwiIGxpbmssXG4gICAqIHNvbWUgaW5zdGl0dXRpb25zIChlLmcuIFVGUlBFKSByZWplY3QgZGlyZWN0IGFjY2VzcyB0byBkaXNjZW50ZS5qc2YuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdldFBvcnRhbFBhZ2UoKTogUHJvbWlzZTxQYWdlPiB7XG4gICAgcmV0dXJuIHRoaXMuaHR0cC5mb2xsb3dBbGxSZWRpcmVjdChcbiAgICAgIGF3YWl0IHRoaXMuaHR0cC5nZXQoJy9zaWdhYS92ZXJQb3J0YWxEaXNjZW50ZS5kbycpXG4gICAgKTtcbiAgfVxuXG4gIGFzeW5jIGdldEFjdGl2aXRpZXMoKTogUHJvbWlzZTxBY3Rpdml0eVtdPiB7XG4gICAgY29uc3QgZnJvbnRQYWdlID0gYXdhaXQgdGhpcy5nZXRQb3J0YWxQYWdlKCk7XG4gICAgY29uc3QgdGFibGUgPSBmcm9udFBhZ2UuJCgnI2F2YWxpYWNhby1wb3J0YWwgPiB0YWJsZScpO1xuICAgIGNvbnN0IHJvd3MgPSB0YWJsZS5maW5kKCd0Ym9keSA+IHRyJykudG9BcnJheSgpO1xuICAgIGlmIChyb3dzLmxlbmd0aCA9PT0gMCkgc2F2ZURlYnVnUGFnZSgncG9ydGFsLWF0aXZpZGFkZXMnLCBmcm9udFBhZ2UpO1xuICAgIGNvbnN0IGxpc3RBY3Rpdml0aWVzOiBBY3Rpdml0eVtdID0gW107XG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgY29uc3QgY2VsbEVsZW1lbnRzID0gZnJvbnRQYWdlLiQocm93KS5maW5kKCd0ZCcpO1xuICAgICAgLy8gU2tpcHMgcm93cyBsaWtlIFwiTsOjbyBow6EgYXRpdmlkYWRlcyBjYWRhc3RyYWRhc1wiIG9yIHNlY3Rpb24gaGVhZGVyc1xuICAgICAgaWYgKGNlbGxFbGVtZW50cy5sZW5ndGggPCAzKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IGRhdGVDZWxsQ29udGVudCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxuICAgICAgICBjZWxsRWxlbWVudHMuZXEoMSkuaHRtbCgpXG4gICAgICApO1xuXG4gICAgICBsZXQgZGF0ZTogRGF0ZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRhdGUgPSB0aGlzLnBhcnNlci5wYXJzZURhdGVzKGRhdGVDZWxsQ29udGVudCwgMSlbMF07XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoIWRhdGUpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBkb25lID1cbiAgICAgICAgY2VsbEVsZW1lbnRzLmVxKDApLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycpID09PSAnL3NpZ2FhL2ltZy9jaGVjay5wbmcnIHx8XG4gICAgICAgIGRhdGUudmFsdWVPZigpIDwgRGF0ZS5ub3coKTtcblxuICAgICAgY29uc3QgaW5mb1RleHRMaW5lcyA9IHRoaXMucGFyc2VyXG4gICAgICAgIC5yZW1vdmVUYWdzSHRtbChjZWxsRWxlbWVudHMuZXEoMikuZmluZCgnc21hbGwnKS5odG1sKCkpXG4gICAgICAgIC5zcGxpdCgnXFxuJylcbiAgICAgICAgLm1hcCgobGluZSkgPT4gbGluZS50cmltKCkpXG4gICAgICAgIC5maWx0ZXIoKGxpbmUpID0+IGxpbmUpO1xuXG4gICAgICBpZiAoaW5mb1RleHRMaW5lcy5sZW5ndGggPCAyKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgY291cnNlVGl0bGUgPSBpbmZvVGV4dExpbmVzWzBdO1xuICAgICAgY29uc3QgW3R5cGUsIC4uLmFjdGl2aXR5VGl0bGVTbGljZXNdID0gaW5mb1RleHRMaW5lc1sxXS5zcGxpdCgnOiAnKTtcbiAgICAgIGNvbnN0IGFjdGl2aXR5VGl0bGUgPSBhY3Rpdml0eVRpdGxlU2xpY2VzLmpvaW4oJzogJyk7XG5cbiAgICAgIGlmICh0eXBlID09PSAnUXVlc3Rpb27DoXJpbycgfHwgdHlwZSA9PT0gJ1RhcmVmYScpIHtcbiAgICAgICAgY29uc3QgSlNGQ0xKUyA9IGNlbGxFbGVtZW50c1xuICAgICAgICAgIC5lcSgyKVxuICAgICAgICAgIC5maW5kKCdzbWFsbCBhW29uY2xpY2tdJylcbiAgICAgICAgICAuYXR0cignb25jbGljaycpO1xuICAgICAgICBpZiAoIUpTRkNMSlMpIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEFjdGl2aXR5IHdpdGhvdXQgbGluay4nKTtcbiAgICAgICAgY29uc3QgZm9ybSA9IGZyb250UGFnZS5wYXJzZUpTRkNMSlMoSlNGQ0xKUyk7XG5cbiAgICAgICAgaWYgKHR5cGUgPT09ICdRdWVzdGlvbsOhcmlvJykge1xuICAgICAgICAgIGxpc3RBY3Rpdml0aWVzLnB1c2goXG4gICAgICAgICAgICB0aGlzLmFjdGl2aXR5RmFjdG9yeS5jcmVhdGVBY3Rpdml0eVF1aXooXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjb3Vyc2VUaXRsZSxcbiAgICAgICAgICAgICAgICBxdWl6VGl0bGU6IGFjdGl2aXR5VGl0bGUsXG4gICAgICAgICAgICAgICAgaWQ6IGZvcm0ucG9zdFZhbHVlcy5pZCxcbiAgICAgICAgICAgICAgICBmb3JtLFxuICAgICAgICAgICAgICAgIGRvbmUsXG4gICAgICAgICAgICAgICAgZGF0ZVxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB0aGlzXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBsaXN0QWN0aXZpdGllcy5wdXNoKFxuICAgICAgICAgICAgdGhpcy5hY3Rpdml0eUZhY3RvcnkuY3JlYXRlQWN0aXZpdHlIb21ld29yayhcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGNvdXJzZVRpdGxlLFxuICAgICAgICAgICAgICAgIGhvbWV3b3JrVGl0bGU6IGFjdGl2aXR5VGl0bGUsXG4gICAgICAgICAgICAgICAgZm9ybSxcbiAgICAgICAgICAgICAgICBkb25lLFxuICAgICAgICAgICAgICAgIGRhdGVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgdGhpc1xuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ0F2YWxpYcOnw6NvJykge1xuICAgICAgICBsaXN0QWN0aXZpdGllcy5wdXNoKFxuICAgICAgICAgIHRoaXMuYWN0aXZpdHlGYWN0b3J5LmNyZWF0ZUFjdGl2aXR5RXhhbShcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgY291cnNlVGl0bGUsXG4gICAgICAgICAgICAgIGV4YW1EZXNjcmlwdGlvbjogYWN0aXZpdHlUaXRsZSxcbiAgICAgICAgICAgICAgZG9uZSxcbiAgICAgICAgICAgICAgZGF0ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHRoaXNcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBsaXN0QWN0aXZpdGllcztcbiAgfVxuICBhc3luYyBnZXRDdXJyZW50UGVyaW9kKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRQZXJpb2QpIHJldHVybiB0aGlzLl9jdXJyZW50UGVyaW9kO1xuICAgIGNvbnN0IGZyb250UGFnZSA9IGF3YWl0IHRoaXMuZ2V0UG9ydGFsUGFnZSgpO1xuICAgIGNvbnN0IHBlcmlvZCA9IGZyb250UGFnZVxuICAgICAgLiQoJyNpbmZvLXVzdWFyaW8gPiBwLnBlcmlvZG8tYXR1YWwgPiBzdHJvbmcnKVxuICAgICAgLnRleHQoKTtcbiAgICB0aGlzLl9jdXJyZW50UGVyaW9kID0gcGVyaW9kO1xuICAgIHJldHVybiBwZXJpb2Q7XG4gIH1cblxuICBhc3luYyBnZXRBY2FkZW1pY0luZGljZXMoKTogUHJvbWlzZTxBY2FkZW1pY0luZGV4W10+IHtcbiAgICBjb25zdCBmcm9udFBhZ2UgPSBhd2FpdCB0aGlzLmdldFBvcnRhbFBhZ2UoKTtcbiAgICBjb25zdCBpbmRpY2VzOiBBY2FkZW1pY0luZGV4W10gPSBbXTtcbiAgICAvLyBUaGUgaW5kaWNlcyBhcmUgcmVuZGVyZWQgYXMgcGFpcnMgb2YgY2VsbHM6IDxhY3JvbnltIHRpdGxlPVwiTmFtZVwiPkNPREU6PC9hY3JvbnltPiB8IHZhbHVlXG4gICAgY29uc3QgY2VsbHMgPSBmcm9udFBhZ2UuJCgnI2FnZW5kYS1kb2NlbnRlIHRkJykudG9BcnJheSgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY2VsbHMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICBjb25zdCBjZWxsID0gZnJvbnRQYWdlLiQoY2VsbHNbaV0pO1xuICAgICAgY29uc3QgbGFiZWwgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChjZWxsLmh0bWwoKSk7XG4gICAgICBjb25zdCBjb2RlTWF0Y2ggPSBsYWJlbC5tYXRjaCgvXihbQS1aXXsyLDV9KTo/JC8pO1xuICAgICAgaWYgKCFjb2RlTWF0Y2gpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgdmFsdWVUZXh0ID0gdGhpcy5wYXJzZXJcbiAgICAgICAgLnJlbW92ZVRhZ3NIdG1sKGZyb250UGFnZS4kKGNlbGxzW2kgKyAxXSkuaHRtbCgpKVxuICAgICAgICAucmVwbGFjZSgnLCcsICcuJyk7XG4gICAgICBpZiAoIS9eLT9cXGQrKFxcLlxcZCspPyQvLnRlc3QodmFsdWVUZXh0KSkgY29udGludWU7XG4gICAgICBjb25zdCBjb2RlID0gY29kZU1hdGNoWzFdO1xuICAgICAgaWYgKGluZGljZXMuc29tZSgoaW5kZXgpID0+IGluZGV4LmNvZGUgPT09IGNvZGUpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG5hbWUgPVxuICAgICAgICBjZWxsLmZpbmQoJ2Fjcm9ueW1bdGl0bGVdLCBhYmJyW3RpdGxlXScpLmF0dHIoJ3RpdGxlJyk/LnRyaW0oKSB8fCBjb2RlO1xuICAgICAgaW5kaWNlcy5wdXNoKHsgY29kZSwgbmFtZSwgdmFsdWU6IE51bWJlcih2YWx1ZVRleHQpIH0pO1xuICAgICAgaSsrO1xuICAgIH1cbiAgICBpZiAoaW5kaWNlcy5sZW5ndGggPT09IDApIHNhdmVEZWJ1Z1BhZ2UoJ3BvcnRhbC1pbmRpY2VzJywgZnJvbnRQYWdlKTtcbiAgICByZXR1cm4gaW5kaWNlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBPcGVucyB0aGUgcmVwb3J0IFwiQ29uc3VsdGFyIE1pbmhhcyBOb3Rhc1wiIHRocm91Z2ggdGhlIHN0dWRlbnQgbWVudS5cbiAgICogVGhlIG1lbnUgaXRlbSBpcyBhIEpTQ29va01lbnUgYWN0aW9uLCBzbyB3ZSBwb3N0IHRoZSBtZW51IGZvcm0gd2l0aFxuICAgKiB0aGUgYWN0aW9uIGZvdW5kIGluIHRoZSBwYWdlIHNjcmlwdHMuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdldEdyYWRlc1JlcG9ydFBhZ2UoKTogUHJvbWlzZTxQYWdlPiB7XG4gICAgY29uc3QgcG9ydGFsUGFnZSA9IGF3YWl0IHRoaXMuZ2V0UG9ydGFsUGFnZSgpO1xuICAgIGNvbnN0IGFjdGlvbk1hdGNoID0gcG9ydGFsUGFnZS5ib2R5RGVjb2RlZC5tYXRjaChcbiAgICAgIC9bJ1wiXShbXidcIl0qOkFcXF0jXFx7XFxzKnJlbGF0b3Jpb05vdGFzQWx1bm9cXC5nZXJhclJlbGF0b3Jpb1xccypcXH0pWydcIl0vXG4gICAgKTtcbiAgICBjb25zdCBmb3JtRWxlbWVudCA9IHBvcnRhbFBhZ2VcbiAgICAgIC4kKCdpbnB1dFtuYW1lPVwianNjb29rX2FjdGlvblwiXScpXG4gICAgICAuY2xvc2VzdCgnZm9ybScpO1xuICAgIGNvbnN0IGZvcm1BY3Rpb24gPSBmb3JtRWxlbWVudC5hdHRyKCdhY3Rpb24nKTtcbiAgICBpZiAoIWFjdGlvbk1hdGNoIHx8ICFmb3JtQWN0aW9uKSB7XG4gICAgICBzYXZlRGVidWdQYWdlKCdwb3J0YWwtbWVudScsIHBvcnRhbFBhZ2UpO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogTWVudSBpdGVtIFwiQ29uc3VsdGFyIE1pbmhhcyBOb3Rhc1wiIG5vdCBmb3VuZC4nKTtcbiAgICB9XG4gICAgY29uc3QgcG9zdFZhbHVlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgIGZvcm1FbGVtZW50LmZpbmQoJ2lucHV0W25hbWVdJykuZWFjaCgoXywgZWxlbWVudCkgPT4ge1xuICAgICAgY29uc3QgbmFtZSA9IHBvcnRhbFBhZ2UuJChlbGVtZW50KS5hdHRyKCduYW1lJyk7XG4gICAgICBpZiAobmFtZSkgcG9zdFZhbHVlc1tuYW1lXSA9IHBvcnRhbFBhZ2UuJChlbGVtZW50KS52YWwoKSB8fCAnJztcbiAgICB9KTtcbiAgICBwb3N0VmFsdWVzWydqc2Nvb2tfYWN0aW9uJ10gPSBhY3Rpb25NYXRjaFsxXTtcbiAgICBjb25zdCBhY3Rpb24gPSBuZXcgVVJMKGZvcm1BY3Rpb24sIHBvcnRhbFBhZ2UudXJsKTtcbiAgICByZXR1cm4gdGhpcy5odHRwLmZvbGxvd0FsbFJlZGlyZWN0KFxuICAgICAgYXdhaXQgdGhpcy5odHRwLnBvc3QoYWN0aW9uLmhyZWYsIHBvc3RWYWx1ZXMsIHsgbm9DYWNoZTogdHJ1ZSB9KVxuICAgICk7XG4gIH1cblxuICBhc3luYyBnZXRHcmFkZXNIaXN0b3J5KCk6IFByb21pc2U8Q291cnNlR3JhZGVzSGlzdG9yeVtdPiB7XG4gICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuZ2V0R3JhZGVzUmVwb3J0UGFnZSgpO1xuICAgIGNvbnN0IHRhYmxlcyA9IHBhZ2UuJCgndGFibGUudGFiZWxhUmVsYXRvcmlvJykudG9BcnJheSgpO1xuICAgIGlmICh0YWJsZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICBzYXZlRGVidWdQYWdlKCdtaW5oYXMtbm90YXMnLCBwYWdlKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEdyYWRlcyByZXBvcnQgd2l0aG91dCB0YWJsZXMuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgcGFyc2VOdW1iZXIgPSAodGV4dDogc3RyaW5nKTogbnVtYmVyIHwgdW5kZWZpbmVkID0+IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gcGFyc2VGbG9hdCh0ZXh0LnJlcGxhY2UoJywnLCAnLicpKTtcbiAgICAgIHJldHVybiBpc05hTih2YWx1ZSkgPyB1bmRlZmluZWQgOiB2YWx1ZTtcbiAgICB9O1xuICAgIGNvbnN0IG5vcm1hbGl6ZSA9ICh0ZXh0OiBzdHJpbmcpID0+XG4gICAgICB0ZXh0XG4gICAgICAgIC5ub3JtYWxpemUoJ05GRCcpXG4gICAgICAgIC5yZXBsYWNlKC9bzIAtza9dL2csICcnKVxuICAgICAgICAudG9Mb3dlckNhc2UoKTtcblxuICAgIGNvbnN0IGhpc3Rvcnk6IENvdXJzZUdyYWRlc0hpc3RvcnlbXSA9IFtdO1xuICAgIGZvciAoY29uc3QgdGFibGUgb2YgdGFibGVzKSB7XG4gICAgICBjb25zdCBwZXJpb2QgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcbiAgICAgICAgcGFnZS4kKHRhYmxlKS5maW5kKCdjYXB0aW9uJykuaHRtbCgpXG4gICAgICApO1xuICAgICAgY29uc3QgaGVhZGVycyA9IHBhZ2VcbiAgICAgICAgLiQodGFibGUpXG4gICAgICAgIC5maW5kKCd0aGVhZCB0cicpXG4gICAgICAgIC5sYXN0KClcbiAgICAgICAgLmNoaWxkcmVuKCd0aCwgdGQnKVxuICAgICAgICAudG9BcnJheSgpXG4gICAgICAgIC5tYXAoKGNlbGwpID0+IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJChjZWxsKS5odG1sKCkpKTtcblxuICAgICAgY29uc3Qgcm93cyA9IHBhZ2UuJCh0YWJsZSkuZmluZCgndGJvZHkgdHInKS50b0FycmF5KCk7XG4gICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGNvbnN0IGNlbGxzID0gcGFnZS4kKHJvdykuY2hpbGRyZW4oJ3RkJykudG9BcnJheSgpO1xuICAgICAgICBpZiAoY2VsbHMubGVuZ3RoIDwgMikgY29udGludWU7XG4gICAgICAgIGNvbnN0IHJhdzogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHt9O1xuICAgICAgICBjZWxscy5mb3JFYWNoKChjZWxsLCBpbmRleCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGhlYWRlciA9IGhlYWRlcnNbaW5kZXhdIHx8IGBDb2x1bmEgJHtpbmRleCArIDF9YDtcbiAgICAgICAgICByYXdbaGVhZGVyXSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJChjZWxsKS5odG1sKCkpO1xuICAgICAgICB9KTtcblxuICAgICAgICBjb25zdCBjb3Vyc2U6IENvdXJzZUdyYWRlc0hpc3RvcnkgPSB7XG4gICAgICAgICAgcGVyaW9kLFxuICAgICAgICAgIGNvZGU6ICcnLFxuICAgICAgICAgIHRpdGxlOiAnJyxcbiAgICAgICAgICBncmFkZXM6IFtdLFxuICAgICAgICAgIHJhd1xuICAgICAgICB9O1xuICAgICAgICBmb3IgKGNvbnN0IFtoZWFkZXIsIHZhbHVlXSBvZiBPYmplY3QuZW50cmllcyhyYXcpKSB7XG4gICAgICAgICAgY29uc3Qga2V5ID0gbm9ybWFsaXplKGhlYWRlcik7XG4gICAgICAgICAgaWYgKGtleSA9PT0gJ2NvZGlnbycpIHtcbiAgICAgICAgICAgIGNvdXJzZS5jb2RlID0gdmFsdWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIGtleSA9PT0gJ2Rpc2NpcGxpbmEnIHx8XG4gICAgICAgICAgICBrZXkgPT09ICdjb21wb25lbnRlIGN1cnJpY3VsYXInIHx8XG4gICAgICAgICAgICBrZXkgPT09ICdjb21wb25lbnRlJ1xuICAgICAgICAgICkge1xuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBzaG93IFwiQ09ERSAtIFRJVExFXCIgaW4gdGhlIHNhbWUgY2VsbFxuICAgICAgICAgICAgY29uc3QgW2NvZGUsIC4uLnRpdGxlXSA9IHZhbHVlLnNwbGl0KCcgLSAnKTtcbiAgICAgICAgICAgIGlmICghY291cnNlLmNvZGUgJiYgdGl0bGUubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBjb3Vyc2UuY29kZSA9IGNvZGU7XG4gICAgICAgICAgICAgIGNvdXJzZS50aXRsZSA9IHRpdGxlLmpvaW4oJyAtICcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgY291cnNlLnRpdGxlID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICgvXihyZXN1bHRhZG98bWVkaWF8bWVkaWEgZmluYWx8bm90YSBmaW5hbCkkLy50ZXN0KGtleSkpIHtcbiAgICAgICAgICAgIGNvdXJzZS5maW5hbEdyYWRlID0gcGFyc2VOdW1iZXIodmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnZmFsdGFzJykge1xuICAgICAgICAgICAgY291cnNlLmFic2VuY2VzID0gcGFyc2VOdW1iZXIodmFsdWUpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoL14oc2l0dWFjYW98c2l0XFwuPykkLy50ZXN0KGtleSkpIHtcbiAgICAgICAgICAgIGNvdXJzZS5zaXR1YXRpb24gPSB2YWx1ZTtcbiAgICAgICAgICB9IGVsc2UgaWYgKC9eKHVuaWR8bm90YXxyZWN8YXYpLy50ZXN0KGtleSkpIHtcbiAgICAgICAgICAgIGNvdXJzZS5ncmFkZXMucHVzaCh7IG5hbWU6IGhlYWRlciwgdmFsdWU6IHBhcnNlTnVtYmVyKHZhbHVlKSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvdXJzZS5jb2RlIHx8IGNvdXJzZS50aXRsZSkgaGlzdG9yeS5wdXNoKGNvdXJzZSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBoaXN0b3J5O1xuICB9XG59XG4iXX0=