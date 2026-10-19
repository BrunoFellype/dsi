"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaCourseStudent = void 0;

require("source-map-support/register");

var _sigaaDebug = require("../helpers/sigaa-debug");

var _url = require("url");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Course in the student's view.
 *
 * @category Internal
 **/
class SigaaCourseStudent {
  /**
   * @inheritdoc
   */

  /**
   * @inheritdoc
   */

  /**
   * @inheritdoc
   */

  /**
   * @inheritdoc
   */

  /**
   * @inheritdoc
   */

  /**
   * @inheritdoc
   */
  constructor(courseData, http, parser, resourcesManagerFactory, lessonParserFactory) {
    this.http = http;
    this.parser = parser;

    _defineProperty(this, "title", void 0);

    _defineProperty(this, "code", void 0);

    _defineProperty(this, "numberOfStudents", void 0);

    _defineProperty(this, "schedule", void 0);

    _defineProperty(this, "id", void 0);

    _defineProperty(this, "period", void 0);

    _defineProperty(this, "form", void 0);

    _defineProperty(this, "resources", void 0);

    _defineProperty(this, "lessonParser", void 0);

    _defineProperty(this, "currentPageCache", void 0);

    _defineProperty(this, "currentCoursePage", 'Principal');

    this.id = courseData.id;
    this.title = courseData.title;
    this.code = courseData.code;
    this.numberOfStudents = courseData.numberOfStudents;
    this.period = courseData.period;
    this.schedule = courseData.schedule;
    this.form = courseData.form;
    this.resources = resourcesManagerFactory.createCourseResourcesManager(this.http, this);
    this.lessonParser = lessonParserFactory.createLessonParser(this.resources);
  }
  /**
   *
   */


  /**
   * Request the course page using the course ID,
   * it is slower than requestCoursePageUsingForm,
   * but works if the form is invalid.
   * @returns Response page.
   */
  async requestCoursePageUsingId() {
    const page = await this.http.get('/sigaa/portais/discente/turmas.jsf');
    if (page.statusCode !== 200) throw new Error('SIGAA: Unexpected courses page status code.');
    const table = page.$('.listagem');

    if (table.length === 0) {
      throw new Error('SIGAA: Unexpected courses page format.');
    }

    const rows = table.find('tbody > tr').toArray();
    const foundCourse = rows.some(row => {
      const cellElements = page.$(row).find('td');
      if (cellElements.eq(0).hasClass('periodo')) return false;
      const buttonOnClick = cellElements.eq(5).find('a[onclick]').attr('onclick');
      if (!buttonOnClick) throw new Error('SIGAA: Unexpected row format at courses page.');
      const form = page.parseJSFCLJS(buttonOnClick);

      if (form.postValues.idTurma === this.form.postValues.idTurma) {
        this.form = form;
        return true;
      }
    });

    if (!foundCourse) {
      throw new Error('SIGAA: Not found course with id:' + this.id);
    }

    return this.requestCoursePageUsingForm();
  }
  /**
   * Request the course page using the course POST Form,
   * it is faster than requestCoursePageUsingId,
   * but don`t works if the form is invalid or expired.
   */


  async requestCoursePageUsingForm(useCache = true) {
    const page = await this.http.post(this.form.action.href, this.form.postValues, {
      shareSameRequest: true,
      noCache: !useCache
    });

    if (page.statusCode === 200) {
      if (page.bodyDecoded.includes('Comportamento Inesperado!')) {
        throw new Error('SIGAA: Unexpected behavior on the course page.');
      }

      return page;
    } else {
      throw new Error('SIGAA: Unexpected course page status code.');
    }
  }
  /**
   * Request the course page using requestCoursePageUsingForm,
   * fallback to requestCoursePageUsingId.
   * @returns Response page.
   */


  async requestCoursePage(useCache = true) {
    return this.requestCoursePageUsingForm(useCache).catch(() => this.requestCoursePageUsingId());
  }

  verifyIfCoursePageIsValid(page, buttonLabel) {
    if (page.statusCode !== 200) throw new Error('SIGAA: Invalid course page status code.');
    let pageCourseCode;

    if (buttonLabel === 'Ver Notas') {
      pageCourseCode = this.parser.removeTagsHtml(page.$('#relatorio h3').html()).split(' - ')[0];
    } else {
      pageCourseCode = this.parser.removeTagsHtml(page.$('#linkCodigoTurma').html()).replace(/ -$/, '');
    }

    if (pageCourseCode === this.code) return; // Newer SIGAA versions (e.g. UFRPE) show the course header in another
    // format, so we also accept a header containing the course code or title.

    const header = this.parser.removeTagsHtml(page.$('#relatorio h3, #linkCodigoTurma, #linkNomeTurma, .nomeTurma').toArray().map(element => page.$(element).html()).join(' '));

    const normalize = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

    if (header && (normalize(header).includes(normalize(this.code)) || normalize(header).includes(normalize(this.title)))) {
      return;
    }

    (0, _sigaaDebug.saveDebugPage)(`turma-${buttonLabel}`, page);
    throw new Error(`SIGAA: Using the old page caused the change to the last accessed course instead of the requested course. Expected: ${this.code}, found: ${pageCourseCode}`);
  }
  /**
   * Receive the name of the side tab and load the tab page
   * @param buttonLabel
   * @param retry
   */


  async getCourseSubMenu(buttonLabel, retry = true) {
    if (buttonLabel === this.currentCoursePage) {
      if (this.currentPageCache) return this.currentPageCache;
    }

    const page = await this.requestCoursePage(retry);
    const buttonElement = page.$('div.itemMenu').toArray().find(buttonEl => this.parser.removeTagsHtml(page.$(buttonEl).html()) === buttonLabel);

    if (!buttonElement) {
      throw new Error('SIGAA: Course sub menu button not found.');
    }

    const buttonOnClick = page.$(buttonElement).parent().attr('onclick');
    if (!buttonOnClick) throw new Error('SIGAA: Course sub menu button does not have the onclick event.');
    const form = page.parseJSFCLJS(buttonOnClick);

    try {
      const pageResponse = await this.http.post(form.action.href, form.postValues);
      this.verifyIfCoursePageIsValid(pageResponse, buttonLabel);

      if (pageResponse.bodyDecoded.includes('Menu Turma Virtual')) {
        this.currentPageCache = pageResponse;
      }

      this.currentCoursePage = buttonLabel;
      return pageResponse;
    } catch (err) {
      if (retry) {
        this.currentPageCache = undefined;
        this.currentCoursePage = 'Principal';
        return this.getCourseSubMenu(buttonLabel, false);
      }

      throw err;
    }
  }
  /**
   * Receive the name of the card on the right of the page and return it
   * @param page
   * @param cardTitle
   */


  async getRightSidebarCard(page, cardTitle) {
    const titleElement = page.$('.rich-stglpanel-header.headerBloco').toArray().find(titleElement => {
      return this.parser.removeTagsHtml(page.$(titleElement).html()) === cardTitle;
    });

    if (!titleElement) {
      throw new Error('SIGAA: Course sidebar card not found.');
    } else {
      return page.$(titleElement).parent().parent();
    }
  }

  static getLessonPageType(page) {
    if (page.$('#formAcoesTurma\\:visualizarAulasEmLista').length === 0 && page.$('#formAcoesTurma\\:visualizarPaginadas').length === 1) return 'list';
    if (page.$('#formAcoesTurma\\:visualizarAulasEmLista').length === 1 && page.$('#formAcoesTurma\\:visualizarPaginadas').length === 0) return 'paged';
    return 'unknown';
  }
  /**
   * @inheritdoc
   */


  async getLessons() {
    const pageLessonsOne = await this.getCourseSubMenu('Principal');
    let onclick;
    const pageLessonsOneType = SigaaCourseStudent.getLessonPageType(pageLessonsOne);

    if (pageLessonsOneType == 'list') {
      onclick = pageLessonsOne.$('#formAcoesTurma\\:linkExibirPaginados').attr('onclick');
    }

    if (pageLessonsOneType == 'paged') {
      onclick = pageLessonsOne.$('#formAcoesTurma\\:linkExibirEmLista').attr('onclick');
    }

    if (!onclick) throw new Error('SIGAA: Cannot find the lesson list toogle.');
    const form = pageLessonsOne.parseJSFCLJS(onclick);
    const pageLessonsTwo = await this.http.post(form.action.href, form.postValues);
    this.verifyIfCoursePageIsValid(pageLessonsTwo, 'Principal');
    const pageLessonsTwoType = SigaaCourseStudent.getLessonPageType(pageLessonsTwo);
    let pageLessonsPaged;
    let pageLessonsList;

    if (pageLessonsOneType == 'paged' && pageLessonsTwoType == 'list') {
      pageLessonsPaged = pageLessonsOne;
      pageLessonsList = pageLessonsTwo;
    } else if (pageLessonsOneType == 'list' && pageLessonsTwoType == 'paged') {
      pageLessonsPaged = pageLessonsTwo;
      pageLessonsList = pageLessonsOne;
    } else throw new Error('SIGAA: Lesson page types other than expected types.');

    this.lessonParser.parseLessonPages(pageLessonsList, pageLessonsPaged);
    return this.resources.lessons.instances;
  }
  /**
   * @inheritdoc
   */


  async getFiles() {
    const page = await this.getCourseSubMenu('Arquivos');
    const table = page.$('.listing');
    const usedFilesId = [];

    if (table.length !== 0) {
      const rows = table.find('tr[class]').toArray();

      for (const row of rows) {
        const cells = page.$(row).children();
        const title = this.parser.removeTagsHtml(cells.first().html());
        const description = this.parser.removeTagsHtml(cells.eq(1).html());
        const buttonElement = cells.eq(3).find('a[onclick]');
        const buttonOnclick = buttonElement.attr('onclick');
        if (!buttonOnclick) throw new Error('SIGAA: Button in the file table does not have the onclick event.');
        const form = page.parseJSFCLJS(buttonOnclick);
        const id = form.postValues['id'];
        const key = form.postValues['key'];
        const fileOptions = {
          title,
          description,
          id,
          key,
          instanceIndentifier: id
        };
        this.resources.files.upsert(fileOptions);
        usedFilesId.push(id);
      }
    }

    this.resources.files.keepOnly(usedFilesId);
    return this.resources.files.instances;
  }
  /**
   * @inheritdoc
   */


  async getForums() {
    const page = await this.getCourseSubMenu('Fóruns');
    const table = page.$('.listing');
    const usedForumIds = [];

    if (table.length !== 0) {
      let forumsIdIndex = 0;
      const rows = table.find('tr[class]').toArray();

      for (const row of rows) {
        const cells = page.$(row).children();
        const titleElement = cells.first().find('a');
        const title = this.parser.removeTagsHtml(titleElement.html());
        const forumType = this.parser.removeTagsHtml(cells.eq(1).html());
        const numOfTopics = parseInt(this.parser.removeTagsHtml(cells.eq(2).html()), 10);
        const author = this.parser.removeTagsHtml(cells.eq(3).html());
        const creationDate = this.parser.parseDates(this.parser.removeTagsHtml(cells.eq(4).html()), 1)[0];
        const titleOnClick = titleElement.attr('onclick');
        if (!titleOnClick) throw new Error('SIGAA: Forum title does not have onclick event.');
        const form = page.parseJSFCLJS(titleOnClick);
        const id = forumsIdIndex;
        forumsIdIndex++;
        const forumOptions = {
          title,
          id: id.toString(),
          instanceIndentifier: id.toString(),
          forumType,
          numOfTopics: numOfTopics,
          author,
          creationDate,
          form
        };
        this.resources.forums.upsert(forumOptions);
        usedForumIds.push(id.toString());
      }
    }

    this.resources.forums.keepOnly(usedForumIds);
    return this.resources.forums.instances;
  }
  /**
   * @inheritdoc
   */


  async getNews() {
    const page = await this.getCourseSubMenu('Notícias');
    const table = page.$('.listing');
    const usedNewsId = [];

    if (table.length !== 0) {
      const rows = table.find('tr[class]').toArray();

      for (const row of rows) {
        const cell = page.$(row).children();
        const title = this.parser.removeTagsHtml(cell.first().html());
        const buttonElement = cell.eq(2).children().first();
        const buttonOnClick = buttonElement.attr('onclick');
        if (!buttonOnClick) throw new Error('SIGAA: News onclick button does not have onclick event.');
        const form = page.parseJSFCLJS(buttonOnClick);
        const id = form.postValues.id;
        const newsOptions = {
          title,
          form,
          id,
          instanceIndentifier: id
        };
        this.resources.news.upsert(newsOptions);
        usedNewsId.push(id);
      }
    }

    this.resources.news.keepOnly(usedNewsId);
    return this.resources.news.instances;
  }
  /**
   * @inheritdoc
   */


  async getAbsence() {
    const page = await this.getCourseSubMenu('Frequência');
    const table = page.$('.listing');
    const absences = [];
    const rows = table.find('tr[class]').toArray();

    for (const row of rows) {
      const cells = page.$(row).children();
      const date = this.parser.removeTagsHtml(cells.first().html());
      const absenceString = this.parser.removeTagsHtml(cells.eq(1).html());
      let numOfAbsences;

      if (absenceString === '' || absenceString === 'Não Informada') {
        continue;
      } else if (absenceString === 'Presente') {
        numOfAbsences = 0;
      } else {
        numOfAbsences = parseInt(absenceString.replace(/\D/gm, ''), 10);
      }

      absences.push({
        date: this.parser.parseDates(date, 1)[0],
        numOfAbsences
      });
    }

    const details = this.parser.removeTagsHtml(page.$('.botoes-show').html()).split('\n');
    let totalAbsences, maxAbsences;

    for (const detail of details) {
      if (detail.includes('Total de Faltas')) {
        totalAbsences = parseInt(detail.replace(/\D/gm, ''), 10);
      } else if (detail.includes('Máximo de Faltas Permitido')) {
        maxAbsences = parseInt(detail.replace(/\D/gm, ''), 10);
      }
    }

    if (typeof maxAbsences !== 'number' || typeof totalAbsences !== 'number') throw new Error('SIGAA: Invalid absence page format.');
    return {
      list: absences,
      totalAbsences,
      maxAbsences
    };
  }
  /**
   * Parse the side evaluation card and returns the name of each evaluation and the date if it has
   */


  async getExamCalendar() {
    const page = await this.requestCoursePage();
    const card = await this.getRightSidebarCard(page, 'Avaliações');
    const examElements = card.find('li').toArray();
    const examList = [];
    const yearString = this.period.split('.')[0];

    for (const examElement of examElements) {
      const description = this.parser.removeTagsHtml(page.$(examElement).find('span.descricao').html());
      const dateHtml = page.$(examElement).find('span.data').html();
      const dateString = this.parser.removeTagsHtml(dateHtml);
      let date;

      try {
        date = this.parser.parseDates(dateString, 1, parseInt(yearString, 10))[0];
      } catch (err) {
        try {
          date = this.parser.parseDates(dateString, 2)[0]; // eslint-disable-next-line no-empty
        } catch (err) {}
      }

      examList.push({
        description,
        date
      });
    }

    return examList;
  }
  /**
   * @inheritdoc
   */


  async getQuizzes() {
    const page = await this.getCourseSubMenu('Questionários');
    const table = page.$('.listing');
    const usedQuizzesIds = [];
    if (table.length === 0) return [];
    const rows = table.find('tr[class]').toArray();

    for (const row of rows) {
      const cells = page.$(row).find('td');
      const title = this.parser.removeTagsHtml(cells.first().html());
      const startDate = this.parser.parseDates(this.parser.removeTagsHtml(cells.eq(1).html()), 1)[0];
      const endDate = this.parser.parseDates(this.parser.removeTagsHtml(cells.eq(2).html()), 1)[0];
      const buttonSendAnswersElement = cells.eq(3).find('a[onclick]');
      let formSendAnswers;

      if (buttonSendAnswersElement.length > 0) {
        const buttonOnclick = buttonSendAnswersElement.attr('onclick');
        if (!buttonOnclick) throw new Error('SIGAA: quiz button onclick does not have onclick event.');
        formSendAnswers = page.parseJSFCLJS(buttonOnclick);
      }

      const buttonViewAnswersSubmittedElement = cells.eq(4).find('a[onclick]');
      let formViewAnswersSubmitted;

      if (buttonViewAnswersSubmittedElement.length > 0) {
        const buttonOnclick = buttonViewAnswersSubmittedElement.attr('onclick');
        if (!buttonOnclick) throw new Error('SIGAA: quiz button onclick does not have onclick event.');
        formViewAnswersSubmitted = page.parseJSFCLJS(buttonOnclick);
      }

      const form = formSendAnswers || formViewAnswersSubmitted;
      let id;

      if (!form) {
        if (!this.resources.lessons.instances.length) {
          await this.getLessons();
        }

        const quiz = this.resources.quizzes.instances.find(quiz => quiz.title === title);

        if (quiz) {
          id = quiz.id;
        } else {
          throw new Error('SIGAA: Not found quiz by title.');
        }
      } else {
        id = form.postValues.id;
      }

      const quizOptions = {
        title,
        startDate,
        endDate,
        id,
        instanceIndentifier: id,
        formSendAnswers,
        formViewAnswersSubmitted
      };
      this.resources.quizzes.upsert(quizOptions);
      usedQuizzesIds.push(id);
    }

    this.resources.quizzes.keepOnly(usedQuizzesIds);
    return this.resources.quizzes.instances;
  }
  /**
   * @inheritdoc
   */


  async getWebContents() {
    const page = await this.getCourseSubMenu('Conteúdo/Página web');
    const table = page.$('.listing');
    const usedWebContentsIds = [];

    if (table.length !== 0) {
      const rows = table.find('tr[class]').toArray();

      for (const row of rows) {
        const cells = page.$(row).find('td');
        const title = this.parser.removeTagsHtml(cells.first().html());
        const dateString = this.parser.removeTagsHtml(cells.eq(1).html());
        const date = this.parser.parseDates(dateString, 1)[0];
        const buttonOnclick = page.$(cells[2]).find('a[onclick]').attr('onclick');
        if (!buttonOnclick) throw new Error('SIGAA: Webcontent has button without onclick event.');
        const form = page.parseJSFCLJS(buttonOnclick);
        const id = form.postValues.id;
        const webContentOptions = {
          title,
          date,
          form,
          id,
          instanceIndentifier: id
        };
        this.resources.webContents.upsert(webContentOptions);
        usedWebContentsIds.push(id);
      }
    }

    this.resources.webContents.keepOnly(usedWebContentsIds);
    return this.resources.webContents.instances;
  }
  /**
   * @inheritdoc
   */


  async getSurveys() {
    // TODO
    throw new Error('SIGAA: getSurveys not implemented.');
  }
  /**
   * @inheritdoc
   */


  async getHomeworks() {
    const page = await this.getCourseSubMenu('Tarefas');
    const tables = page.$('.listing').toArray();
    if (!tables) return [];
    const usedHomeworksIds = [];

    for (const table of tables) {
      //If table title is 'Tarefas Em Grupo'
      const isGroupHomework = this.parser.removeTagsHtml(page.$(table).siblings('legend').html()) === 'Tarefas Em Grupo';
      const rows = page.$(table).find('tr[class]').toArray();

      for (let i = 0; i < rows.length; i += 2) {
        const cells = page.$(rows[i]).find('td');
        const cellDescription = page.$(rows[i + 1]).find('td');
        const title = this.parser.removeTagsHtml(cells.eq(1).html());
        const description = this.parser.removeTagsHtml(cellDescription.html());
        const date = this.parser.removeTagsHtml(cells.eq(2).html());
        const dates = this.parser.parseDates(date, 2);
        const haveGrade = this.parser.removeTagsHtml(cells.eq(3).html()) !== 'Não';
        const buttonSendHomeworkElement = page.$(cells.eq(5).find('a[onclick]'));
        let formSendHomework;

        if (buttonSendHomeworkElement.length !== 0) {
          const onClick = buttonSendHomeworkElement.attr('onclick');
          if (!onClick) throw new Error('SIGAA: Button send homework without onclick event.');
          formSendHomework = page.parseJSFCLJS(onClick);
        }

        const buttonViewHomeworkSubmittedElement = page.$(cells.eq(6).find('a[onclick]'));
        let formViewHomeworkSubmitted;

        if (buttonViewHomeworkSubmittedElement.length !== 0) {
          const onClick = buttonViewHomeworkSubmittedElement.attr('onclick');
          if (!onClick) throw new Error('SIGAA: Button view homework without onclick event.');
          formViewHomeworkSubmitted = page.parseJSFCLJS(onClick);
        }

        const form = formSendHomework || formViewHomeworkSubmitted;
        let id;
        let instanceIndentifier;

        if (!form) {
          if (!this.resources.lessons.instances.length) {
            await this.getLessons();
          }

          const homeworkList = this.resources.homework.instances.filter(homework => homework.title === title);

          if (homeworkList.length > 1) {
            throw new Error('SIGAA: There is more than one homework with same title and without id.');
          } else if (homeworkList.length == 1) {
            id = homeworkList[0]._instanceIndentifier;
          } else {
            instanceIndentifier = '_' + title;
          }
        } else {
          id = form.postValues.id;
        }

        if (id) {
          instanceIndentifier = id;
        }

        if (instanceIndentifier) {
          const homeworkOptions = {
            title,
            startDate: dates[0],
            endDate: dates[1],
            description,
            isGroupHomework,
            id,
            instanceIndentifier,
            formSendHomework,
            formViewHomeworkSubmitted,
            haveGrade
          };
          this.resources.homework.upsert(homeworkOptions);
          usedHomeworksIds.push(instanceIndentifier);
        }
      }
    }

    this.resources.homework.keepOnly(usedHomeworksIds);
    return this.resources.homework.instances;
  }
  /**
   * @inheritdoc
   */


  async getMembers() {
    const page = await this.getCourseSubMenu('Participantes');
    const tables = page.$('table.participantes').toArray();
    const tablesNames = page.$('fieldset').toArray();

    if (tables.length !== tablesNames.length) {
      throw new Error('SIGAA: Unexpected page members format.');
    }

    let tableTeacher;
    let tableStudent;
    tablesNames.forEach((value, index) => {
      const label = this.parser.removeTagsHtml(page.$(value).html());
      if (label.includes('Professores')) tableTeacher = tables[index];else if (label.includes('Alunos')) tableStudent = tables[index];
    });
    const teachers = [];

    if (tableTeacher) {
      const teacherElements = page.$(tableTeacher).find('tr').toArray();

      for (const teacherElement of teacherElements) {
        let department;
        let formation;
        let username;
        let email;
        const informationsString = page.$(teacherElement).find('td[valign]').html() || '';
        const informations = informationsString.split('<br>').slice(1, -1);

        for (const information of informations) {
          const label = this.parser.removeTagsHtml((information.match(/^[\s\S]*?(?=:[\s]*?<em>)/g) || [])[0]);
          const informationContent = this.parser.removeTagsHtml((information.match(/(?=<em>)[\s\S]*?(?=<\/em>)/g) || [])[0]);

          switch (label) {
            case 'Departamento':
              department = informationContent;
              break;

            case 'Formação':
              formation = informationContent;
              break;

            case 'Usuário':
              username = informationContent;
              break;

            case 'E-mail':
            case 'E-Mail':
              email = informationContent;
              break;

            default:
              console.log('WARNING:Teacher information label not recognized:' + label);
          }
        }

        const name = this.parser.removeTagsHtml(page.$(teacherElement).find('strong > a').html());
        if (!username || !email) throw new Error('SIGAA: Invalid teacher format at member page.');
        const teacher = {
          name,
          username,
          department,
          formation,
          email
        };
        const photoHREF = page.$(teacherElement).find('img').attr('src');
        if (!photoHREF) throw new Error('SIGAA: teacher profile picture without src at member page.');
        const photoURL = new _url.URL(photoHREF, page.url.href);

        if (!photoURL.href.includes('no_picture.png')) {
          teacher.photoURL = photoURL;
        }

        teachers.push(teacher);
      }
    }

    const students = [];

    if (tableStudent) {
      const rows = page.$(tableStudent).find('tr').toArray();

      for (const row of rows) {
        const numberOfColumn = page.$(row).find('td[valign]').length;

        for (let column = 0; column < numberOfColumn; column++) {
          const informationsString = page.$(row).find('td[valign]').eq(column).html() || '';
          const informations = informationsString.split('<br>').slice(1);
          let registration;
          let username;
          let program;
          let registrationDate;
          let email;

          for (const information of informations) {
            const label = this.parser.removeTagsHtml((information.match(/^[\s\S]*?(?=:[\s]*?<em>)/g) || [])[0]);
            const informationContent = this.parser.removeTagsHtml((information.match(/(?=<em>)[\s\S]*?(?=<\/em>)/g) || [])[0]);

            switch (label) {
              case 'Matrícula':
                {
                  registration = informationContent;
                  break;
                }

              case 'Usuário':
                {
                  username = informationContent;
                  break;
                }

              case 'Curso':
                {
                  program = informationContent;
                  break;
                }

              case 'Data Matrícula':
                {
                  const informationDateSplited = informationContent.split('-');
                  const year = parseInt(informationDateSplited[2], 10);
                  const month = parseInt(informationDateSplited[1], 10) - 1;
                  const day = parseInt(informationDateSplited[0], 10);
                  registrationDate = new Date(year, month, day);
                  break;
                }

              case 'E-mail':
              case 'E-Mail':
                {
                  email = informationContent;
                  break;
                }

              default:
                {
                  console.log('WARNING:Student information label not recognized:' + label);
                }
            }
          }

          if (!username || !email || !registrationDate || !registration || !program) throw new Error('SIGAA: Invalid student format at member page.');
          const name = this.parser.removeTagsHtml(page.$(row).find('strong').eq(column).html());
          const student = {
            name,
            username,
            program,
            registration,
            registrationDate,
            email
          };
          const photoHREF = page.$(row).find('td[width="47"] img').eq(column).attr('src');
          if (!photoHREF) throw new Error('SIGAA: student profile picture without src at member page.');
          const photoURL = new _url.URL(photoHREF, page.url.href);

          if (!photoURL.href.includes('no_picture.png')) {
            student.photoURL = photoURL;
          }

          students.push(student);
        }
      }
    }

    return {
      teachers,
      students
    };
  }
  /**
   * @inheritdoc
   */


  async getGrades(retry = true) {
    try {
      const page = await this.getCourseSubMenu('Ver Notas', retry);

      const getPositionByCellColSpan = (ths, cell) => {
        let i = 0;

        for (const tr of ths.toArray()) {
          if (cell === tr) {
            return i;
          }

          i += parseInt(page.$(tr).attr('colspan') || '1', 10);
        }

        throw new Error('SIGAA: Invalid grade table.');
      };

      const removeCellsWithName = ['', 'Matrícula', 'Nome', 'Sit.', 'Faltas'];
      const table = page.$('table.tabelaRelatorio');

      if (table.length < 1) {
        // Course without grades released yet
        if (/n[aã]o (foram|h[aá]) (lan[cç]ad|notas)|nenhuma nota/i.test(page.bodyDecoded)) return [];
        (0, _sigaaDebug.saveDebugPage)('turma-notas', page);
        throw new Error('SIGAA: Received empty table on grade page.');
      }

      const theadTrs = page.$('thead tr').toArray();
      const valueCells = page.$(table).find('tbody tr').children();

      if (valueCells.length === 0) {
        throw new Error('SIGAA: Page grades without grades.');
      }

      const grades = [];
      const theadElements = [];

      for (const theadTr of theadTrs) {
        theadElements.push(page.$(theadTr).find('th'));
      }

      for (let i = 0; i < theadElements[0].length; i++) {
        const gradeGroupName = this.parser.removeTagsHtml(theadElements[0].eq(i).html());
        if (removeCellsWithName.indexOf(gradeGroupName) !== -1) continue;
        const index = getPositionByCellColSpan(theadElements[0], theadElements[0][i]);
        const theadElementColspan = parseInt(theadElements[0].eq(i).attr('colspan') || '1', 10);
        let type;
        const gradeType = page.$(`#tipoUnid${i}`).val();

        switch (gradeType) {
          case 'P':
            type = 'weighted-average';
            break;

          case 'A':
            type = 'arithmetic-average';
            break;

          case 'S':
            type = 'sum-of-grades';
            break;

          default:
            type = 'only-average';
            break;
        }

        if (type === 'only-average' || theadElementColspan == 1) {
          const valueString = this.parser.removeTagsHtml(valueCells.eq(index).html()).replace(/,/g, '.');
          let value;

          if (valueString.length > 0) {
            value = parseFloat(valueString);
          }

          grades.push({
            name: gradeGroupName,
            value,
            type: 'only-average'
          });
        } else {
          const gradesSumOfGrades = [];
          const gradesWeighted = [];
          const gradesArithmetic = [];

          for (let j = index; j < index + theadElementColspan; j++) {
            const fullId = theadElements[1].eq(j).attr('id');
            if (!fullId) throw new Error('SIGAA: Grade without id.');
            const gradeId = fullId.slice(5);

            if (gradeId !== '') {
              const gradeName = page.$(`input#denAval_${gradeId}`).val();
              const gradeCode = page.$(`input#abrevAval_${gradeId}`).val();
              let value = parseFloat(this.parser.removeTagsHtml(valueCells.eq(j).html()).replace(/,/g, '.'));
              if (!value && value !== 0) value = undefined;

              if (type === 'sum-of-grades') {
                const maxValue = parseFloat(page.$(`input#notaAval_${gradeId}`).val());
                gradesSumOfGrades.push({
                  name: gradeName,
                  code: gradeCode,
                  maxValue: maxValue,
                  value
                });
              } else if (type === 'weighted-average') {
                const gradeWeight = parseFloat(page.$(`input#pesoAval_${gradeId}`).val());
                gradesWeighted.push({
                  name: gradeName,
                  code: gradeCode,
                  weight: gradeWeight,
                  value
                });
              } else if (type === 'arithmetic-average') {
                gradesArithmetic.push({
                  name: gradeName,
                  code: gradeCode,
                  value
                });
              }
            } else {
              let average = parseFloat(this.parser.removeTagsHtml(valueCells.eq(j).html()).replace(/,/g, '.'));
              if (isNaN(average)) average = undefined;

              if (gradesSumOfGrades.length > 0 && gradesWeighted.length > 0 && gradesArithmetic.length > 0) {
                throw new Error('SIGAA: Invalid grade type.');
              }

              if (type === 'sum-of-grades') {
                grades.push({
                  name: gradeGroupName,
                  value: average,
                  grades: gradesSumOfGrades,
                  type: 'sum-of-grades'
                });
              } else if (type === 'weighted-average') {
                grades.push({
                  name: gradeGroupName,
                  value: average,
                  grades: gradesWeighted,
                  type: 'weighted-average'
                });
              } else if (type === 'arithmetic-average') {
                grades.push({
                  name: gradeGroupName,
                  value: average,
                  grades: gradesArithmetic,
                  type: 'arithmetic-average'
                });
              }
            }
          }
        }
      }

      return grades;
    } catch (error) {
      if (retry) {
        return this.getGrades(false);
      } else {
        throw error;
      }
    }
  }
  /**
   * @inheritdoc
   */


  async getSyllabus() {
    const page = await this.getCourseSubMenu('Plano de Ensino');
    const tables = page.$('table.listagem').toArray();
    const response = {
      schedule: [],
      evaluations: [],
      basicReferences: [],
      supplementaryReferences: []
    };

    for (const table of tables) {
      const titleElement = page.$(table).find('caption');
      const title = this.parser.removeTagsHtml(titleElement.html());
      const rows = page.$(table).children('tbody').children('tr').toArray();

      switch (title) {
        case 'Metodologia de Ensino e Avaliação':
          {
            for (const row of rows) {
              const rowBodyElement = page.$(row).children('td');
              const body = this.parser.removeTagsHtmlKeepingEmphasis(rowBodyElement.html());
              const rowFieldElement = page.$(row).children('th');
              const rowField = this.parser.removeTagsHtml(rowFieldElement.html());

              if (rowField === 'Metodologia:') {
                response.methods = body;
              } else if (rowField === 'Procedimentos de Avaliação da Aprendizagem:') {
                response.assessmentProcedures = body;
              } else if (rowField === 'Horário de atendimento:') {
                response.attendanceSchedule = body;
              } else {
                throw new Error('SIGAA: Label not found.');
              }
            }

            break;
          }

        case 'Cronograma de Aulas':
          {
            const schedule = [];

            for (const row of rows) {
              const startDateElement = page.$(row).children('td').eq(0);
              const endDateElement = page.$(row).children('td').eq(1);
              const bodyElement = page.$(row).children('td').eq(2);
              const startDateString = this.parser.removeTagsHtml(startDateElement.html());
              let startDate;

              if (startDateString) {
                try {
                  const dates = this.parser.parseDates(startDateString, 1);
                  startDate = dates[0]; // eslint-disable-next-line no-empty
                } catch (err) {}
              }

              const endDateString = this.parser.removeTagsHtml(endDateElement.html());
              let endDate;

              if (endDateString) {
                try {
                  const dates = this.parser.parseDates(endDateString, 1);
                  endDate = dates[0]; // eslint-disable-next-line no-empty
                } catch (err) {}
              }

              const description = this.parser.removeTagsHtml(bodyElement.html());
              schedule.push({
                description,
                startDate,
                endDate
              });
            }

            response.schedule = schedule;
            break;
          }

        case 'Avaliações':
          {
            const evaluations = [];

            for (const row of rows) {
              const dateElement = page.$(row).children('td').eq(0);
              const descriptionElement = page.$(row).children('td').eq(1);
              const dateString = this.parser.removeTagsHtml(dateElement.html());
              let date;

              if (dateString) {
                try {
                  const dates = this.parser.parseDates(dateString, 1);
                  date = dates[0]; // eslint-disable-next-line no-empty
                } catch (err) {}
              }

              const descriptionText = this.parser.removeTagsHtml(descriptionElement.html());
              evaluations.push({
                description: descriptionText,
                date
              });
            }

            response.evaluations = evaluations;
            break;
          }

        case 'Referências Básicas':
        case 'Referências Complementares':
          {
            const references = [];

            for (const row of rows) {
              const referenceTypeElement = page.$(row).find('td').eq(0);
              const referenceType = this.parser.removeTagsHtml(referenceTypeElement.html());
              const descriptionElement = page.$(row).children('td').eq(1);
              const descriptionText = this.parser.removeTagsHtmlKeepingEmphasis(descriptionElement.html());
              references.push({
                description: descriptionText,
                type: referenceType
              });
            }

            if (title === 'Referências Básicas') {
              response.basicReferences = references;
            } else if (title === 'Referências Complementares') {
              response.supplementaryReferences = references;
            }

            break;
          }

        default:
          console.log('WARNING:Education plan table title not recognized:' + title);
      }
    }

    return response;
  }

}

exports.SigaaCourseStudent = SigaaCourseStudent;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3Vyc2VzL3NpZ2FhLWNvdXJzZS1zdHVkZW50LnRzIl0sIm5hbWVzIjpbIlNpZ2FhQ291cnNlU3R1ZGVudCIsImNvbnN0cnVjdG9yIiwiY291cnNlRGF0YSIsImh0dHAiLCJwYXJzZXIiLCJyZXNvdXJjZXNNYW5hZ2VyRmFjdG9yeSIsImxlc3NvblBhcnNlckZhY3RvcnkiLCJpZCIsInRpdGxlIiwiY29kZSIsIm51bWJlck9mU3R1ZGVudHMiLCJwZXJpb2QiLCJzY2hlZHVsZSIsImZvcm0iLCJyZXNvdXJjZXMiLCJjcmVhdGVDb3Vyc2VSZXNvdXJjZXNNYW5hZ2VyIiwibGVzc29uUGFyc2VyIiwiY3JlYXRlTGVzc29uUGFyc2VyIiwicmVxdWVzdENvdXJzZVBhZ2VVc2luZ0lkIiwicGFnZSIsImdldCIsInN0YXR1c0NvZGUiLCJFcnJvciIsInRhYmxlIiwiJCIsImxlbmd0aCIsInJvd3MiLCJmaW5kIiwidG9BcnJheSIsImZvdW5kQ291cnNlIiwic29tZSIsInJvdyIsImNlbGxFbGVtZW50cyIsImVxIiwiaGFzQ2xhc3MiLCJidXR0b25PbkNsaWNrIiwiYXR0ciIsInBhcnNlSlNGQ0xKUyIsInBvc3RWYWx1ZXMiLCJpZFR1cm1hIiwicmVxdWVzdENvdXJzZVBhZ2VVc2luZ0Zvcm0iLCJ1c2VDYWNoZSIsInBvc3QiLCJhY3Rpb24iLCJocmVmIiwic2hhcmVTYW1lUmVxdWVzdCIsIm5vQ2FjaGUiLCJib2R5RGVjb2RlZCIsImluY2x1ZGVzIiwicmVxdWVzdENvdXJzZVBhZ2UiLCJjYXRjaCIsInZlcmlmeUlmQ291cnNlUGFnZUlzVmFsaWQiLCJidXR0b25MYWJlbCIsInBhZ2VDb3Vyc2VDb2RlIiwicmVtb3ZlVGFnc0h0bWwiLCJodG1sIiwic3BsaXQiLCJyZXBsYWNlIiwiaGVhZGVyIiwibWFwIiwiZWxlbWVudCIsImpvaW4iLCJub3JtYWxpemUiLCJ0ZXh0IiwidG9VcHBlckNhc2UiLCJnZXRDb3Vyc2VTdWJNZW51IiwicmV0cnkiLCJjdXJyZW50Q291cnNlUGFnZSIsImN1cnJlbnRQYWdlQ2FjaGUiLCJidXR0b25FbGVtZW50IiwiYnV0dG9uRWwiLCJwYXJlbnQiLCJwYWdlUmVzcG9uc2UiLCJlcnIiLCJ1bmRlZmluZWQiLCJnZXRSaWdodFNpZGViYXJDYXJkIiwiY2FyZFRpdGxlIiwidGl0bGVFbGVtZW50IiwiZ2V0TGVzc29uUGFnZVR5cGUiLCJnZXRMZXNzb25zIiwicGFnZUxlc3NvbnNPbmUiLCJvbmNsaWNrIiwicGFnZUxlc3NvbnNPbmVUeXBlIiwicGFnZUxlc3NvbnNUd28iLCJwYWdlTGVzc29uc1R3b1R5cGUiLCJwYWdlTGVzc29uc1BhZ2VkIiwicGFnZUxlc3NvbnNMaXN0IiwicGFyc2VMZXNzb25QYWdlcyIsImxlc3NvbnMiLCJpbnN0YW5jZXMiLCJnZXRGaWxlcyIsInVzZWRGaWxlc0lkIiwiY2VsbHMiLCJjaGlsZHJlbiIsImZpcnN0IiwiZGVzY3JpcHRpb24iLCJidXR0b25PbmNsaWNrIiwia2V5IiwiZmlsZU9wdGlvbnMiLCJpbnN0YW5jZUluZGVudGlmaWVyIiwiZmlsZXMiLCJ1cHNlcnQiLCJwdXNoIiwia2VlcE9ubHkiLCJnZXRGb3J1bXMiLCJ1c2VkRm9ydW1JZHMiLCJmb3J1bXNJZEluZGV4IiwiZm9ydW1UeXBlIiwibnVtT2ZUb3BpY3MiLCJwYXJzZUludCIsImF1dGhvciIsImNyZWF0aW9uRGF0ZSIsInBhcnNlRGF0ZXMiLCJ0aXRsZU9uQ2xpY2siLCJmb3J1bU9wdGlvbnMiLCJ0b1N0cmluZyIsImZvcnVtcyIsImdldE5ld3MiLCJ1c2VkTmV3c0lkIiwiY2VsbCIsIm5ld3NPcHRpb25zIiwibmV3cyIsImdldEFic2VuY2UiLCJhYnNlbmNlcyIsImRhdGUiLCJhYnNlbmNlU3RyaW5nIiwibnVtT2ZBYnNlbmNlcyIsImRldGFpbHMiLCJ0b3RhbEFic2VuY2VzIiwibWF4QWJzZW5jZXMiLCJkZXRhaWwiLCJsaXN0IiwiZ2V0RXhhbUNhbGVuZGFyIiwiY2FyZCIsImV4YW1FbGVtZW50cyIsImV4YW1MaXN0IiwieWVhclN0cmluZyIsImV4YW1FbGVtZW50IiwiZGF0ZUh0bWwiLCJkYXRlU3RyaW5nIiwiZ2V0UXVpenplcyIsInVzZWRRdWl6emVzSWRzIiwic3RhcnREYXRlIiwiZW5kRGF0ZSIsImJ1dHRvblNlbmRBbnN3ZXJzRWxlbWVudCIsImZvcm1TZW5kQW5zd2VycyIsImJ1dHRvblZpZXdBbnN3ZXJzU3VibWl0dGVkRWxlbWVudCIsImZvcm1WaWV3QW5zd2Vyc1N1Ym1pdHRlZCIsInF1aXoiLCJxdWl6emVzIiwicXVpek9wdGlvbnMiLCJnZXRXZWJDb250ZW50cyIsInVzZWRXZWJDb250ZW50c0lkcyIsIndlYkNvbnRlbnRPcHRpb25zIiwid2ViQ29udGVudHMiLCJnZXRTdXJ2ZXlzIiwiZ2V0SG9tZXdvcmtzIiwidGFibGVzIiwidXNlZEhvbWV3b3Jrc0lkcyIsImlzR3JvdXBIb21ld29yayIsInNpYmxpbmdzIiwiaSIsImNlbGxEZXNjcmlwdGlvbiIsImRhdGVzIiwiaGF2ZUdyYWRlIiwiYnV0dG9uU2VuZEhvbWV3b3JrRWxlbWVudCIsImZvcm1TZW5kSG9tZXdvcmsiLCJvbkNsaWNrIiwiYnV0dG9uVmlld0hvbWV3b3JrU3VibWl0dGVkRWxlbWVudCIsImZvcm1WaWV3SG9tZXdvcmtTdWJtaXR0ZWQiLCJob21ld29ya0xpc3QiLCJob21ld29yayIsImZpbHRlciIsIl9pbnN0YW5jZUluZGVudGlmaWVyIiwiaG9tZXdvcmtPcHRpb25zIiwiZ2V0TWVtYmVycyIsInRhYmxlc05hbWVzIiwidGFibGVUZWFjaGVyIiwidGFibGVTdHVkZW50IiwiZm9yRWFjaCIsInZhbHVlIiwiaW5kZXgiLCJsYWJlbCIsInRlYWNoZXJzIiwidGVhY2hlckVsZW1lbnRzIiwidGVhY2hlckVsZW1lbnQiLCJkZXBhcnRtZW50IiwiZm9ybWF0aW9uIiwidXNlcm5hbWUiLCJlbWFpbCIsImluZm9ybWF0aW9uc1N0cmluZyIsImluZm9ybWF0aW9ucyIsInNsaWNlIiwiaW5mb3JtYXRpb24iLCJtYXRjaCIsImluZm9ybWF0aW9uQ29udGVudCIsImNvbnNvbGUiLCJsb2ciLCJuYW1lIiwidGVhY2hlciIsInBob3RvSFJFRiIsInBob3RvVVJMIiwiVVJMIiwidXJsIiwic3R1ZGVudHMiLCJudW1iZXJPZkNvbHVtbiIsImNvbHVtbiIsInJlZ2lzdHJhdGlvbiIsInByb2dyYW0iLCJyZWdpc3RyYXRpb25EYXRlIiwiaW5mb3JtYXRpb25EYXRlU3BsaXRlZCIsInllYXIiLCJtb250aCIsImRheSIsIkRhdGUiLCJzdHVkZW50IiwiZ2V0R3JhZGVzIiwiZ2V0UG9zaXRpb25CeUNlbGxDb2xTcGFuIiwidGhzIiwidHIiLCJyZW1vdmVDZWxsc1dpdGhOYW1lIiwidGVzdCIsInRoZWFkVHJzIiwidmFsdWVDZWxscyIsImdyYWRlcyIsInRoZWFkRWxlbWVudHMiLCJ0aGVhZFRyIiwiZ3JhZGVHcm91cE5hbWUiLCJpbmRleE9mIiwidGhlYWRFbGVtZW50Q29sc3BhbiIsInR5cGUiLCJncmFkZVR5cGUiLCJ2YWwiLCJ2YWx1ZVN0cmluZyIsInBhcnNlRmxvYXQiLCJncmFkZXNTdW1PZkdyYWRlcyIsImdyYWRlc1dlaWdodGVkIiwiZ3JhZGVzQXJpdGhtZXRpYyIsImoiLCJmdWxsSWQiLCJncmFkZUlkIiwiZ3JhZGVOYW1lIiwiZ3JhZGVDb2RlIiwibWF4VmFsdWUiLCJncmFkZVdlaWdodCIsIndlaWdodCIsImF2ZXJhZ2UiLCJpc05hTiIsImVycm9yIiwiZ2V0U3lsbGFidXMiLCJyZXNwb25zZSIsImV2YWx1YXRpb25zIiwiYmFzaWNSZWZlcmVuY2VzIiwic3VwcGxlbWVudGFyeVJlZmVyZW5jZXMiLCJyb3dCb2R5RWxlbWVudCIsImJvZHkiLCJyZW1vdmVUYWdzSHRtbEtlZXBpbmdFbXBoYXNpcyIsInJvd0ZpZWxkRWxlbWVudCIsInJvd0ZpZWxkIiwibWV0aG9kcyIsImFzc2Vzc21lbnRQcm9jZWR1cmVzIiwiYXR0ZW5kYW5jZVNjaGVkdWxlIiwic3RhcnREYXRlRWxlbWVudCIsImVuZERhdGVFbGVtZW50IiwiYm9keUVsZW1lbnQiLCJzdGFydERhdGVTdHJpbmciLCJlbmREYXRlU3RyaW5nIiwiZGF0ZUVsZW1lbnQiLCJkZXNjcmlwdGlvbkVsZW1lbnQiLCJkZXNjcmlwdGlvblRleHQiLCJyZWZlcmVuY2VzIiwicmVmZXJlbmNlVHlwZUVsZW1lbnQiLCJyZWZlcmVuY2VUeXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTs7QUFNQTs7OztBQTZKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ08sTUFBTUEsa0JBQU4sQ0FBa0Q7QUFDdkQ7QUFDRjtBQUNBOztBQUdFO0FBQ0Y7QUFDQTs7QUFHRTtBQUNGO0FBQ0E7O0FBR0U7QUFDRjtBQUNBOztBQUdFO0FBQ0Y7QUFDQTs7QUFHRTtBQUNGO0FBQ0E7QUFXRUMsRUFBQUEsV0FBVyxDQUNUQyxVQURTLEVBRURDLElBRkMsRUFHREMsTUFIQyxFQUlUQyx1QkFKUyxFQUtUQyxtQkFMUyxFQU1UO0FBQUEsU0FKUUgsSUFJUixHQUpRQSxJQUlSO0FBQUEsU0FIUUMsTUFHUixHQUhRQSxNQUdSOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBOztBQUFBLCtDQW1CMEIsV0FuQjFCOztBQUNBLFNBQUtHLEVBQUwsR0FBVUwsVUFBVSxDQUFDSyxFQUFyQjtBQUNBLFNBQUtDLEtBQUwsR0FBYU4sVUFBVSxDQUFDTSxLQUF4QjtBQUNBLFNBQUtDLElBQUwsR0FBWVAsVUFBVSxDQUFDTyxJQUF2QjtBQUNBLFNBQUtDLGdCQUFMLEdBQXdCUixVQUFVLENBQUNRLGdCQUFuQztBQUNBLFNBQUtDLE1BQUwsR0FBY1QsVUFBVSxDQUFDUyxNQUF6QjtBQUNBLFNBQUtDLFFBQUwsR0FBZ0JWLFVBQVUsQ0FBQ1UsUUFBM0I7QUFDQSxTQUFLQyxJQUFMLEdBQVlYLFVBQVUsQ0FBQ1csSUFBdkI7QUFFQSxTQUFLQyxTQUFMLEdBQWlCVCx1QkFBdUIsQ0FBQ1UsNEJBQXhCLENBQ2YsS0FBS1osSUFEVSxFQUVmLElBRmUsQ0FBakI7QUFJQSxTQUFLYSxZQUFMLEdBQW9C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a0JBQWtCLEdBQUd6UCxJQUFJLENBQUNLLENBQUwsQ0FBT08sR0FBUCxFQUFZOEQsUUFBWixDQUFxQixJQUFyQixFQUEyQjVELEVBQTNCLENBQThCLENBQTlCLENBQTNCO0FBRUEsb0JBQU00TyxlQUFlLEdBQUcsS0FBS3pRLE1BQUwsQ0FBWTRQLDZCQUFaLENBQ3RCWSxrQkFBa0IsQ0FBQ3JOLElBQW5CLEVBRHNCLENBQXhCO0FBR0F1TixjQUFBQSxVQUFVLENBQUN4SyxJQUFYLENBQWdCO0FBQ2RQLGdCQUFBQSxXQUFXLEVBQUU4SyxlQURDO0FBRWR2QyxnQkFBQUEsSUFBSSxFQUFFMEM7QUFGUSxlQUFoQjtBQUlEOztBQUNELGdCQUFJeFEsS0FBSyxLQUFLLHFCQUFkLEVBQXFDO0FBQ25Da1AsY0FBQUEsUUFBUSxDQUFDRSxlQUFULEdBQTJCa0IsVUFBM0I7QUFDRCxhQUZELE1BRU8sSUFBSXRRLEtBQUssS0FBSyw0QkFBZCxFQUE0QztBQUNqRGtQLGNBQUFBLFFBQVEsQ0FBQ0csdUJBQVQsR0FBbUNpQixVQUFuQztBQUNEOztBQUVEO0FBQ0Q7O0FBQ0Q7QUFDRTFFLFVBQUFBLE9BQU8sQ0FBQ0MsR0FBUixDQUNFLHVEQUF1RDdMLEtBRHpEO0FBN0hKO0FBaUlEOztBQUNELFdBQU9rUCxRQUFQO0FBQ0Q7O0FBeHdDc0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzYXZlRGVidWdQYWdlIH0gZnJvbSAnQGhlbHBlcnMvc2lnYWEtZGVidWcnO1xuaW1wb3J0IHsgTGVzc29uIH0gZnJvbSAnQGNvdXJzZVJlc291cmNlcy9zaWdhYS1sZXNzb24tc3R1ZGVudCc7XG5pbXBvcnQgeyBOZXdzRGF0YSwgTmV3cyB9IGZyb20gJ0Bjb3Vyc2VSZXNvdXJjZXMvc2lnYWEtbmV3cy1zdHVkZW50JztcbmltcG9ydCB7IFBhcnNlciB9IGZyb20gJ0BoZWxwZXJzL3NpZ2FhLXBhcnNlcic7XG5pbXBvcnQgeyBGaWxlIH0gZnJvbSAnQHJlc291cmNlcy9zaWdhYS1maWxlJztcbmltcG9ydCB7IEhUVFAgfSBmcm9tICdAc2Vzc2lvbi9zaWdhYS1odHRwJztcbmltcG9ydCB7IFVSTCB9IGZyb20gJ3VybCc7XG5pbXBvcnQgeyBTaWdhYUZvcm0sIFBhZ2UgfSBmcm9tICdAc2Vzc2lvbi9zaWdhYS1wYWdlJztcbmltcG9ydCB7IFF1aXpEYXRhLCBRdWl6IH0gZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLXF1aXotc3R1ZGVudCc7XG5pbXBvcnQgeyBIb21ld29ya0RhdGEsIEhvbWV3b3JrIH0gZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLWhvbWV3b3JrLXN0dWRlbnQnO1xuaW1wb3J0IHsgU2lnYWFTdXJ2ZXkgfSBmcm9tICdAYXR0YWNobWVudHMvc2lnYWEtc3VydmV5LXN0dWRlbnQnO1xuaW1wb3J0IHsgQ291cnNlUmVzb3VyY2VzTWFuYWdlckZhY3RvcnkgfSBmcm9tICcuL3NpZ2FhLWNvdXJzZS1yZXNvdXJjZXMtbWFuYWdlci1mYWN0b3J5JztcbmltcG9ydCB7IEV4YW0gfSBmcm9tICdAY291cnNlUmVzb3VyY2VzL3NpZ2FhLWV4YW0tc3R1ZGVudCc7XG5pbXBvcnQgeyBTeWxsYWJ1cyB9IGZyb20gJ0Bjb3Vyc2VSZXNvdXJjZXMvc2lnYWEtc3lsbGFidXMtc3R1ZGVudCc7XG5pbXBvcnQgeyBMZXNzb25QYXJzZXJGYWN0b3J5IH0gZnJvbSAnLi9zaWdhYS1sZXNzb24tcGFyc2VyLWZhY3RvcnknO1xuXG5pbXBvcnQge1xuICBHcmFkZUdyb3VwLFxuICBTdWJHcmFkZUFyaXRobWV0aWNBdmVyYWdlLFxuICBTdWJHcmFkZVN1bU9mR3JhZGVzLFxuICBTdWJHcmFkZVdlaWdodGVkQXZlcmFnZVxufSBmcm9tICdAY291cnNlUmVzb3VyY2VzL3NpZ2FhLWdyYWRlcy1zdHVkZW50JztcblxuaW1wb3J0IHtcbiAgRm9ydW1EYXRhLFxuICBDb3Vyc2VGb3J1bVxufSBmcm9tICdAY291cnNlUmVzb3VyY2VzL2ZvcnVtL3NpZ2FhLWNvdXJzZS1mb3J1bS1zdHVkZW50JztcblxuaW1wb3J0IHtcbiAgV2ViQ29udGVudCxcbiAgV2ViQ29udGVudERhdGFcbn0gZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLXdlYi1jb250ZW50LXN0dWRlbnQnO1xuaW1wb3J0IHtcbiAgQWJzZW5jZURheSxcbiAgQWJzZW5jZUxpc3Rcbn0gZnJvbSAnQGNvdXJzZVJlc291cmNlcy9zaWdhYS1hYnNlbmNlLWxpc3Qtc3R1ZGVudCc7XG5cbmltcG9ydCB7XG4gIE1lbWJlckxpc3QsXG4gIFN0dWRlbnQsXG4gIFRlYWNoZXJcbn0gZnJvbSAnQGNvdXJzZVJlc291cmNlcy9zaWdhYS1tZW1iZXItbGlzdC1zdHVkZW50JztcblxuLyoqXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb3Vyc2VTdHVkZW50RGF0YSB7XG4gIGlkOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIGNvZGU6IHN0cmluZztcbiAgbnVtYmVyT2ZTdHVkZW50czogbnVtYmVyO1xuICBwZXJpb2Q6IHN0cmluZztcbiAgc2NoZWR1bGU6IHN0cmluZztcbiAgZm9ybTogU2lnYWFGb3JtO1xufVxuXG4vKipcbiAqIENvdXJzZSBpbiB0aGUgc3R1ZGVudCdzIHZpZXcuXG4gKiBAY2F0ZWdvcnkgUHVibGljXG4gKiovXG5leHBvcnQgaW50ZXJmYWNlIENvdXJzZVN0dWRlbnQge1xuICAvKipcbiAgICogU2luZ2xlIHN0cmluZyBpbmRpY2F0aW5nIHRoZSBjb3Vyc2UuXG4gICAqXG4gICAqIFN0cmluZyDDum5pY2EgaW5kaWNhbmRvIG8gY3Vyc28uXG4gICAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb3Vyc2UgdGl0bGUgKE5vbWUgZGEgdHVybWEpLlxuICAgKi9cbiAgcmVhZG9ubHkgdGl0bGU6IHN0cmluZztcblxuICAvKipcbiAgICogQ291cnNlIG5hbWUgYWJicmV2aWF0aW9uLlxuICAgKlxuICAgKiBDw7NkaWdvIChhYnJldmlhw6fDo28pIGRhIHR1cm1hLlxuICAgKi9cbiAgcmVhZG9ubHkgY29kZTogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBDb3Vyc2UgU2NoZWR1bGUuXG4gICAqXG4gICAqIEhvcsOhcmlvIGRhcyBhdWxhcy5cbiAgICovXG4gIHJlYWRvbmx5IHNjaGVkdWxlOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBzdHVkZW50cywgaXMgMCBpZiB0aGUgY291cnNlIG9mIHRoZSBwZXJpb2QgaXMgbm90IHRoZSBjdXJyZW50IG9uZS5cbiAgICovXG4gIHJlYWRvbmx5IG51bWJlck9mU3R1ZGVudHM6IG51bWJlcjtcblxuICAvKipcbiAgICogQ291cnNlIFNlbWVzdGVyLlxuICAgKi9cbiAgcmVhZG9ubHkgcGVyaW9kOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxpc3Qgb2YgbGVzc29ucy5cbiAgICovXG4gIGdldExlc3NvbnMoKTogUHJvbWlzZTxMZXNzb25bXT47XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdG8gdGhlIGxpc3Qgb2YgZmlsZXMgcHJvdmlkZWQgYnkgdGhlIHRlYWNoZXIuXG4gICAqL1xuICBnZXRGaWxlcygpOiBQcm9taXNlPEZpbGVbXT47XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvdXJzZXMgZm9ydW0uXG4gICAqL1xuICBnZXRGb3J1bXMoKTogUHJvbWlzZTxDb3Vyc2VGb3J1bVtdPjtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY291cnNlcyBuZXdzLlxuICAgKi9cbiAgZ2V0TmV3cygpOiBQcm9taXNlPE5ld3NbXT47XG5cbiAgLyoqXG4gICAqIFJldHVybnMgeW91ciBhYnNlbmNlcy5cbiAgICovXG4gIGdldEFic2VuY2UoKTogUHJvbWlzZTxBYnNlbmNlTGlzdD47XG5cbiAgLyoqXG4gICAqIFBhcnNlIHRoZSBzaWRlIGV2YWx1YXRpb24gY2FyZCBhbmQgcmV0dXJucyB0aGUgbmFtZSBvZiBlYWNoIGV2YWx1YXRpb24gYW5kIHRoZSBkYXRlIGlmIGl0IGhhc1xuICAgKi9cbiAgZ2V0RXhhbUNhbGVuZGFyKCk6IFByb21pc2U8RXhhbVtdPjtcblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgY291cnNlcyBxdWl6emVzLlxuICAgKi9cbiAgZ2V0UXVpenplcygpOiBQcm9taXNlPFF1aXpbXT47XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGNvdXJzZSBXZWJDb250ZW50IEFycmF5LlxuICAgKi9cbiAgZ2V0V2ViQ29udGVudHMoKTogUHJvbWlzZTxXZWJDb250ZW50W10+O1xuXG4gIC8qKlxuICAgKiBUbyBkb1xuICAgKi9cbiAgZ2V0U3VydmV5cygpOiBQcm9taXNlPFNpZ2FhU3VydmV5W10+O1xuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHlvdXJzIGhvbWV3b3JrLlxuICAgKi9cbiAgZ2V0SG9tZXdvcmtzKCk6IFByb21pc2U8SG9tZXdvcmtbXT47XG5cbiAgLyoqXG4gICAqIEdldCBtZW1iZXJzIG9iamVjdC5cbiAgICovXG4gIGdldE1lbWJlcnMoKTogUHJvbWlzZTxNZW1iZXJMaXN0PjtcblxuICAvKipcbiAgICogR2V0IGdyYWRlcyBhcnJheS5cbiAgICovXG4gIGdldEdyYWRlcygpOiBQcm9taXNlPEdyYWRlR3JvdXBbXT47XG5cbiAgLyoqXG4gICAqIEdldCBTeWxsYWJ1cyAoUGxhbm8gZGUgZW5zaW5vKS5cbiAgICovXG4gIGdldFN5bGxhYnVzKCk6IFByb21pc2U8U3lsbGFidXM+O1xufVxuXG4vKipcbiAqIENvdXJzZSBpbiB0aGUgc3R1ZGVudCdzIHZpZXcuXG4gKlxuICogQGNhdGVnb3J5IEludGVybmFsXG4gKiovXG5leHBvcnQgY2xhc3MgU2lnYWFDb3Vyc2VTdHVkZW50IGltcGxlbWVudHMgQ291cnNlU3R1ZGVudCB7XG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgcmVhZG9ubHkgdGl0bGU7XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0ZG9jXG4gICAqL1xuICByZWFkb25seSBjb2RlO1xuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgcmVhZG9ubHkgbnVtYmVyT2ZTdHVkZW50cztcblxuICAvKipcbiAgICogQGluaGVyaXRkb2NcbiAgICovXG4gIHJlYWRvbmx5IHNjaGVkdWxlO1xuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgcmVhZG9ubHkgaWQ7XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0ZG9jXG4gICAqL1xuICByZWFkb25seSBwZXJpb2Q7XG5cbiAgcHJpdmF0ZSBmb3JtO1xuXG4gIHByaXZhdGUgcmVzb3VyY2VzO1xuXG4gIHByaXZhdGUgbGVzc29uUGFyc2VyO1xuXG4gIGN1cnJlbnRQYWdlQ2FjaGU/OiBQYWdlO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIGNvdXJzZURhdGE6IENvdXJzZVN0dWRlbnREYXRhLFxuICAgIHByaXZhdGUgaHR0cDogSFRUUCxcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyLFxuICAgIHJlc291cmNlc01hbmFnZXJGYWN0b3J5OiBDb3Vyc2VSZXNvdXJjZXNNYW5hZ2VyRmFjdG9yeSxcbiAgICBsZXNzb25QYXJzZXJGYWN0b3J5OiBMZXNzb25QYXJzZXJGYWN0b3J5XG4gICkge1xuICAgIHRoaXMuaWQgPSBjb3Vyc2VEYXRhLmlkO1xuICAgIHRoaXMudGl0bGUgPSBjb3Vyc2VEYXRhLnRpdGxlO1xuICAgIHRoaXMuY29kZSA9IGNvdXJzZURhdGEuY29kZTtcbiAgICB0aGlzLm51bWJlck9mU3R1ZGVudHMgPSBjb3Vyc2VEYXRhLm51bWJlck9mU3R1ZGVudHM7XG4gICAgdGhpcy5wZXJpb2QgPSBjb3Vyc2VEYXRhLnBlcmlvZDtcbiAgICB0aGlzLnNjaGVkdWxlID0gY291cnNlRGF0YS5zY2hlZHVsZTtcbiAgICB0aGlzLmZvcm0gPSBjb3Vyc2VEYXRhLmZvcm07XG5cbiAgICB0aGlzLnJlc291cmNlcyA9IHJlc291cmNlc01hbmFnZXJGYWN0b3J5LmNyZWF0ZUNvdXJzZVJlc291cmNlc01hbmFnZXIoXG4gICAgICB0aGlzLmh0dHAsXG4gICAgICB0aGlzXG4gICAgKTtcbiAgICB0aGlzLmxlc3NvblBhcnNlciA9IGxlc3NvblBhcnNlckZhY3RvcnkuY3JlYXRlTGVzc29uUGFyc2VyKHRoaXMucmVzb3VyY2VzKTtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKi9cbiAgcHJpdmF0ZSBjdXJyZW50Q291cnNlUGFnZSA9ICdQcmluY2lwYWwnO1xuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IHRoZSBjb3Vyc2UgcGFnZSB1c2luZyB0aGUgY291cnNlIElELFxuICAgKiBpdCBpcyBzbG93ZXIgdGhhbiByZXF1ZXN0Q291cnNlUGFnZVVzaW5nRm9ybSxcbiAgICogYnV0IHdvcmtzIGlmIHRoZSBmb3JtIGlzIGludmFsaWQuXG4gICAqIEByZXR1cm5zIFJlc3BvbnNlIHBhZ2UuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHJlcXVlc3RDb3Vyc2VQYWdlVXNpbmdJZCgpIHtcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5odHRwLmdldCgnL3NpZ2FhL3BvcnRhaXMvZGlzY2VudGUvdHVybWFzLmpzZicpO1xuICAgIGlmIChwYWdlLnN0YXR1c0NvZGUgIT09IDIwMClcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFVuZXhwZWN0ZWQgY291cnNlcyBwYWdlIHN0YXR1cyBjb2RlLicpO1xuXG4gICAgY29uc3QgdGFibGUgPSBwYWdlLiQoJy5saXN0YWdlbScpO1xuICAgIGlmICh0YWJsZS5sZW5ndGggPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFVuZXhwZWN0ZWQgY291cnNlcyBwYWdlIGZvcm1hdC4nKTtcbiAgICB9XG4gICAgY29uc3Qgcm93cyA9IHRhYmxlLmZpbmQoJ3Rib2R5ID4gdHInKS50b0FycmF5KCk7XG4gICAgY29uc3QgZm91bmRDb3Vyc2UgPSByb3dzLnNvbWUoKHJvdykgPT4ge1xuICAgICAgY29uc3QgY2VsbEVsZW1lbnRzID0gcGFnZS4kKHJvdykuZmluZCgndGQnKTtcbiAgICAgIGlmIChjZWxsRWxlbWVudHMuZXEoMCkuaGFzQ2xhc3MoJ3BlcmlvZG8nKSkgcmV0dXJuIGZhbHNlO1xuICAgICAgY29uc3QgYnV0dG9uT25DbGljayA9IGNlbGxFbGVtZW50c1xuICAgICAgICAuZXEoNSlcbiAgICAgICAgLmZpbmQoJ2Fbb25jbGlja10nKVxuICAgICAgICAuYXR0cignb25jbGljaycpO1xuICAgICAgaWYgKCFidXR0b25PbkNsaWNrKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBVbmV4cGVjdGVkIHJvdyBmb3JtYXQgYXQgY291cnNlcyBwYWdlLicpO1xuICAgICAgY29uc3QgZm9ybSA9IHBhZ2UucGFyc2VKU0ZDTEpTKGJ1dHRvbk9uQ2xpY2spO1xuICAgICAgaWYgKGZvcm0ucG9zdFZhbHVlcy5pZFR1cm1hID09PSB0aGlzLmZvcm0ucG9zdFZhbHVlcy5pZFR1cm1hKSB7XG4gICAgICAgIHRoaXMuZm9ybSA9IGZvcm07XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghZm91bmRDb3Vyc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IE5vdCBmb3VuZCBjb3Vyc2Ugd2l0aCBpZDonICsgdGhpcy5pZCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnJlcXVlc3RDb3Vyc2VQYWdlVXNpbmdGb3JtKCk7XG4gIH1cblxuICAvKipcbiAgICogUmVxdWVzdCB0aGUgY291cnNlIHBhZ2UgdXNpbmcgdGhlIGNvdXJzZSBQT1NUIEZvcm0sXG4gICAqIGl0IGlzIGZhc3RlciB0aGFuIHJlcXVlc3RDb3Vyc2VQYWdlVXNpbmdJZCxcbiAgICogYnV0IGRvbmB0IHdvcmtzIGlmIHRoZSBmb3JtIGlzIGludmFsaWQgb3IgZXhwaXJlZC5cbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcmVxdWVzdENvdXJzZVBhZ2VVc2luZ0Zvcm0odXNlQ2FjaGUgPSB0cnVlKSB7XG4gICAgY29uc3QgcGFnZSA9IGF3YWl0IHRoaXMuaHR0cC5wb3N0KFxuICAgICAgdGhpcy5mb3JtLmFjdGlvbi5ocmVmLFxuICAgICAgdGhpcy5mb3JtLnBvc3RWYWx1ZXMsXG4gICAgICB7XG4gICAgICAgIHNoYXJlU2FtZVJlcXVlc3Q6IHRydWUsXG4gICAgICAgIG5vQ2FjaGU6ICF1c2VDYWNoZVxuICAgICAgfVxuICAgICk7XG4gICAgaWYgKHBhZ2Uuc3RhdHVzQ29kZSA9PT0gMjAwKSB7XG4gICAgICBpZiAocGFnZS5ib2R5RGVjb2RlZC5pbmNsdWRlcygnQ29tcG9ydGFtZW50byBJbmVzcGVyYWRvIScpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFVuZXhwZWN0ZWQgYmVoYXZpb3Igb24gdGhlIGNvdXJzZSBwYWdlLicpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHBhZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFVuZXhwZWN0ZWQgY291cnNlIHBhZ2Ugc3RhdHVzIGNvZGUuJyk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFJlcXVlc3QgdGhlIGNvdXJzZSBwYWdlIHVzaW5nIHJlcXVlc3RDb3Vyc2VQYWdlVXNpbmdGb3JtLFxuICAgKiBmYWxsYmFjayB0byByZXF1ZXN0Q291cnNlUGFnZVVzaW5nSWQuXG4gICAqIEByZXR1cm5zIFJlc3BvbnNlIHBhZ2UuXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHJlcXVlc3RDb3Vyc2VQYWdlKHVzZUNhY2hlID0gdHJ1ZSk6IFByb21pc2U8UGFnZT4ge1xuICAgIHJldHVybiB0aGlzLnJlcXVlc3RDb3Vyc2VQYWdlVXNpbmdGb3JtKHVzZUNhY2hlKS5jYXRjaCgoKSA9PlxuICAgICAgdGhpcy5yZXF1ZXN0Q291cnNlUGFnZVVzaW5nSWQoKVxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHZlcmlmeUlmQ291cnNlUGFnZUlzVmFsaWQocGFnZTogUGFnZSwgYnV0dG9uTGFiZWw6IHN0cmluZyk6IHZvaWQge1xuICAgIGlmIChwYWdlLnN0YXR1c0NvZGUgIT09IDIwMClcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEludmFsaWQgY291cnNlIHBhZ2Ugc3RhdHVzIGNvZGUuJyk7XG5cbiAgICBsZXQgcGFnZUNvdXJzZUNvZGU6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICBpZiAoYnV0dG9uTGFiZWwgPT09ICdWZXIgTm90YXMnKSB7XG4gICAgICBwYWdlQ291cnNlQ29kZSA9IHRoaXMucGFyc2VyXG4gICAgICAgIC5yZW1vdmVUYWdzSHRtbChwYWdlLiQoJyNyZWxhdG9yaW8gaDMnKS5odG1sKCkpXG4gICAgICAgIC5zcGxpdCgnIC0gJylbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhZ2VDb3Vyc2VDb2RlID0gdGhpcy5wYXJzZXJcbiAgICAgICAgLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJCgnI2xpbmtDb2RpZ29UdXJtYScpLmh0bWwoKSlcbiAgICAgICAgLnJlcGxhY2UoLyAtJC8sICcnKTtcbiAgICB9XG5cbiAgICBpZiAocGFnZUNvdXJzZUNvZGUgPT09IHRoaXMuY29kZSkgcmV0dXJuO1xuXG4gICAgLy8gTmV3ZXIgU0lHQUEgdmVyc2lvbnMgKGUuZy4gVUZSUEUpIHNob3cgdGhlIGNvdXJzZSBoZWFkZXIgaW4gYW5vdGhlclxuICAgIC8vIGZvcm1hdCwgc28gd2UgYWxzbyBhY2NlcHQgYSBoZWFkZXIgY29udGFpbmluZyB0aGUgY291cnNlIGNvZGUgb3IgdGl0bGUuXG4gICAgY29uc3QgaGVhZGVyID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXG4gICAgICBwYWdlXG4gICAgICAgIC4kKCcjcmVsYXRvcmlvIGgzLCAjbGlua0NvZGlnb1R1cm1hLCAjbGlua05vbWVUdXJtYSwgLm5vbWVUdXJtYScpXG4gICAgICAgIC50b0FycmF5KClcbiAgICAgICAgLm1hcCgoZWxlbWVudCkgPT4gcGFnZS4kKGVsZW1lbnQpLmh0bWwoKSlcbiAgICAgICAgLmpvaW4oJyAnKVxuICAgICk7XG4gICAgY29uc3Qgbm9ybWFsaXplID0gKHRleHQ6IHN0cmluZykgPT5cbiAgICAgIHRleHQubm9ybWFsaXplKCdORkQnKS5yZXBsYWNlKC9bzIAtza9dL2csICcnKS50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChcbiAgICAgIGhlYWRlciAmJlxuICAgICAgKG5vcm1hbGl6ZShoZWFkZXIpLmluY2x1ZGVzKG5vcm1hbGl6ZSh0aGlzLmNvZGUpKSB8fFxuICAgICAgICBub3JtYWxpemUoaGVhZGVyKS5pbmNsdWRlcyhub3JtYWxpemUodGhpcy50aXRsZSkpKVxuICAgICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHNhdmVEZWJ1Z1BhZ2UoYHR1cm1hLSR7YnV0dG9uTGFiZWx9YCwgcGFnZSk7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgYFNJR0FBOiBVc2luZyB0aGUgb2xkIHBhZ2UgY2F1c2VkIHRoZSBjaGFuZ2UgdG8gdGhlIGxhc3QgYWNjZXNzZWQgY291cnNlIGluc3RlYWQgb2YgdGhlIHJlcXVlc3RlZCBjb3Vyc2UuIEV4cGVjdGVkOiAke3RoaXMuY29kZX0sIGZvdW5kOiAke3BhZ2VDb3Vyc2VDb2RlfWBcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlY2VpdmUgdGhlIG5hbWUgb2YgdGhlIHNpZGUgdGFiIGFuZCBsb2FkIHRoZSB0YWIgcGFnZVxuICAgKiBAcGFyYW0gYnV0dG9uTGFiZWxcbiAgICogQHBhcmFtIHJldHJ5XG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGdldENvdXJzZVN1Yk1lbnUoXG4gICAgYnV0dG9uTGFiZWw6IHN0cmluZyxcbiAgICByZXRyeSA9IHRydWVcbiAgKTogUHJvbWlzZTxQYWdlPiB7XG4gICAgaWYgKGJ1dHRvbkxhYmVsID09PSB0aGlzLmN1cnJlbnRDb3Vyc2VQYWdlKSB7XG4gICAgICBpZiAodGhpcy5jdXJyZW50UGFnZUNhY2hlKSByZXR1cm4gdGhpcy5jdXJyZW50UGFnZUNhY2hlO1xuICAgIH1cblxuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLnJlcXVlc3RDb3Vyc2VQYWdlKHJldHJ5KTtcblxuICAgIGNvbnN0IGJ1dHRvbkVsZW1lbnQgPSBwYWdlXG4gICAgICAuJCgnZGl2Lml0ZW1NZW51JylcbiAgICAgIC50b0FycmF5KClcbiAgICAgIC5maW5kKFxuICAgICAgICAoYnV0dG9uRWwpID0+XG4gICAgICAgICAgdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwocGFnZS4kKGJ1dHRvbkVsKS5odG1sKCkpID09PSBidXR0b25MYWJlbFxuICAgICAgKTtcblxuICAgIGlmICghYnV0dG9uRWxlbWVudCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogQ291cnNlIHN1YiBtZW51IGJ1dHRvbiBub3QgZm91bmQuJyk7XG4gICAgfVxuXG4gICAgY29uc3QgYnV0dG9uT25DbGljayA9IHBhZ2UuJChidXR0b25FbGVtZW50KS5wYXJlbnQoKS5hdHRyKCdvbmNsaWNrJyk7XG4gICAgaWYgKCFidXR0b25PbkNsaWNrKVxuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnU0lHQUE6IENvdXJzZSBzdWIgbWVudSBidXR0b24gZG9lcyBub3QgaGF2ZSB0aGUgb25jbGljayBldmVudC4nXG4gICAgICApO1xuXG4gICAgY29uc3QgZm9ybSA9IHBhZ2UucGFyc2VKU0ZDTEpTKGJ1dHRvbk9uQ2xpY2spO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYWdlUmVzcG9uc2UgPSBhd2FpdCB0aGlzLmh0dHAucG9zdChcbiAgICAgICAgZm9ybS5hY3Rpb24uaHJlZixcbiAgICAgICAgZm9ybS5wb3N0VmFsdWVzXG4gICAgICApO1xuICAgICAgdGhpcy52ZXJpZnlJZkNvdXJzZVBhZ2VJc1ZhbGlkKHBhZ2VSZXNwb25zZSwgYnV0dG9uTGFiZWwpO1xuICAgICAgaWYgKHBhZ2VSZXNwb25zZS5ib2R5RGVjb2RlZC5pbmNsdWRlcygnTWVudSBUdXJtYSBWaXJ0dWFsJykpIHtcbiAgICAgICAgdGhpcy5jdXJyZW50UGFnZUNhY2hlID0gcGFnZVJlc3BvbnNlO1xuICAgICAgfVxuICAgICAgdGhpcy5jdXJyZW50Q291cnNlUGFnZSA9IGJ1dHRvbkxhYmVsO1xuICAgICAgcmV0dXJuIHBhZ2VSZXNwb25zZTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGlmIChyZXRyeSkge1xuICAgICAgICB0aGlzLmN1cnJlbnRQYWdlQ2FjaGUgPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuY3VycmVudENvdXJzZVBhZ2UgPSAnUHJpbmNpcGFsJztcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q291cnNlU3ViTWVudShidXR0b25MYWJlbCwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBSZWNlaXZlIHRoZSBuYW1lIG9mIHRoZSBjYXJkIG9uIHRoZSByaWdodCBvZiB0aGUgcGFnZSBhbmQgcmV0dXJuIGl0XG4gICAqIEBwYXJhbSBwYWdlXG4gICAqIEBwYXJhbSBjYXJkVGl0bGVcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZ2V0UmlnaHRTaWRlYmFyQ2FyZChcbiAgICBwYWdlOiBQYWdlLFxuICAgIGNhcmRUaXRsZTogc3RyaW5nXG4gICk6IFByb21pc2U8Y2hlZXJpby5DaGVlcmlvPiB7XG4gICAgY29uc3QgdGl0bGVFbGVtZW50ID0gcGFnZVxuICAgICAgLiQoJy5yaWNoLXN0Z2xwYW5lbC1oZWFkZXIuaGVhZGVyQmxvY28nKVxuICAgICAgLnRvQXJyYXkoKVxuICAgICAgLmZpbmQoKHRpdGxlRWxlbWVudCkgPT4ge1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJCh0aXRsZUVsZW1lbnQpLmh0bWwoKSkgPT09IGNhcmRUaXRsZVxuICAgICAgICApO1xuICAgICAgfSk7XG4gICAgaWYgKCF0aXRsZUVsZW1lbnQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IENvdXJzZSBzaWRlYmFyIGNhcmQgbm90IGZvdW5kLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gcGFnZS4kKHRpdGxlRWxlbWVudCkucGFyZW50KCkucGFyZW50KCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgZ2V0TGVzc29uUGFnZVR5cGUocGFnZTogUGFnZSk6ICdsaXN0JyB8ICdwYWdlZCcgfCAndW5rbm93bicge1xuICAgIGlmIChcbiAgICAgIHBhZ2UuJCgnI2Zvcm1BY29lc1R1cm1hXFxcXDp2aXN1YWxpemFyQXVsYXNFbUxpc3RhJykubGVuZ3RoID09PSAwICYmXG4gICAgICBwYWdlLiQoJyNmb3JtQWNvZXNUdXJtYVxcXFw6dmlzdWFsaXphclBhZ2luYWRhcycpLmxlbmd0aCA9PT0gMVxuICAgIClcbiAgICAgIHJldHVybiAnbGlzdCc7XG5cbiAgICBpZiAoXG4gICAgICBwYWdlLiQoJyNmb3JtQWNvZXNUdXJtYVxcXFw6dmlzdWFsaXphckF1bGFzRW1MaXN0YScpLmxlbmd0aCA9PT0gMSAmJlxuICAgICAgcGFnZS4kKCcjZm9ybUFjb2VzVHVybWFcXFxcOnZpc3VhbGl6YXJQYWdpbmFkYXMnKS5sZW5ndGggPT09IDBcbiAgICApXG4gICAgICByZXR1cm4gJ3BhZ2VkJztcbiAgICByZXR1cm4gJ3Vua25vd24nO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0ZG9jXG4gICAqL1xuICBhc3luYyBnZXRMZXNzb25zKCk6IFByb21pc2U8TGVzc29uW10+IHtcbiAgICBjb25zdCBwYWdlTGVzc29uc09uZSA9IGF3YWl0IHRoaXMuZ2V0Q291cnNlU3ViTWVudSgnUHJpbmNpcGFsJyk7XG4gICAgbGV0IG9uY2xpY2s7XG5cbiAgICBjb25zdCBwYWdlTGVzc29uc09uZVR5cGUgPVxuICAgICAgU2lnYWFDb3Vyc2VTdHVkZW50LmdldExlc3NvblBhZ2VUeXBlKHBhZ2VMZXNzb25zT25lKTtcblxuICAgIGlmIChwYWdlTGVzc29uc09uZVR5cGUgPT0gJ2xpc3QnKSB7XG4gICAgICBvbmNsaWNrID0gcGFnZUxlc3NvbnNPbmVcbiAgICAgICAgLiQoJyNmb3JtQWNvZXNUdXJtYVxcXFw6bGlua0V4aWJpclBhZ2luYWRvcycpXG4gICAgICAgIC5hdHRyKCdvbmNsaWNrJyk7XG4gICAgfVxuXG4gICAgaWYgKHBhZ2VMZXNzb25zT25lVHlwZSA9PSAncGFnZWQnKSB7XG4gICAgICBvbmNsaWNrID0gcGFnZUxlc3NvbnNPbmVcbiAgICAgICAgLiQoJyNmb3JtQWNvZXNUdXJtYVxcXFw6bGlua0V4aWJpckVtTGlzdGEnKVxuICAgICAgICAuYXR0cignb25jbGljaycpO1xuICAgIH1cblxuICAgIGlmICghb25jbGljaykgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogQ2Fubm90IGZpbmQgdGhlIGxlc3NvbiBsaXN0IHRvb2dsZS4nKTtcblxuICAgIGNvbnN0IGZvcm0gPSBwYWdlTGVzc29uc09uZS5wYXJzZUpTRkNMSlMob25jbGljayk7XG4gICAgY29uc3QgcGFnZUxlc3NvbnNUd28gPSBhd2FpdCB0aGlzLmh0dHAucG9zdChcbiAgICAgIGZvcm0uYWN0aW9uLmhyZWYsXG4gICAgICBmb3JtLnBvc3RWYWx1ZXNcbiAgICApO1xuXG4gICAgdGhpcy52ZXJpZnlJZkNvdXJzZVBhZ2VJc1ZhbGlkKHBhZ2VMZXNzb25zVHdvLCAnUHJpbmNpcGFsJyk7XG5cbiAgICBjb25zdCBwYWdlTGVzc29uc1R3b1R5cGUgPVxuICAgICAgU2lnYWFDb3Vyc2VTdHVkZW50LmdldExlc3NvblBhZ2VUeXBlKHBhZ2VMZXNzb25zVHdvKTtcbiAgICBsZXQgcGFnZUxlc3NvbnNQYWdlZDtcbiAgICBsZXQgcGFnZUxlc3NvbnNMaXN0O1xuXG4gICAgaWYgKHBhZ2VMZXNzb25zT25lVHlwZSA9PSAncGFnZWQnICYmIHBhZ2VMZXNzb25zVHdvVHlwZSA9PSAnbGlzdCcpIHtcbiAgICAgIHBhZ2VMZXNzb25zUGFnZWQgPSBwYWdlTGVzc29uc09uZTtcbiAgICAgIHBhZ2VMZXNzb25zTGlzdCA9IHBhZ2VMZXNzb25zVHdvO1xuICAgIH0gZWxzZSBpZiAocGFnZUxlc3NvbnNPbmVUeXBlID09ICdsaXN0JyAmJiBwYWdlTGVzc29uc1R3b1R5cGUgPT0gJ3BhZ2VkJykge1xuICAgICAgcGFnZUxlc3NvbnNQYWdlZCA9IHBhZ2VMZXNzb25zVHdvO1xuICAgICAgcGFnZUxlc3NvbnNMaXN0ID0gcGFnZUxlc3NvbnNPbmU7XG4gICAgfSBlbHNlXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBMZXNzb24gcGFnZSB0eXBlcyBvdGhlciB0aGFuIGV4cGVjdGVkIHR5cGVzLicpO1xuXG4gICAgdGhpcy5sZXNzb25QYXJzZXIucGFyc2VMZXNzb25QYWdlcyhwYWdlTGVzc29uc0xpc3QsIHBhZ2VMZXNzb25zUGFnZWQpO1xuICAgIHJldHVybiB0aGlzLnJlc291cmNlcy5sZXNzb25zLmluc3RhbmNlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgYXN5bmMgZ2V0RmlsZXMoKTogUHJvbWlzZTxGaWxlW10+IHtcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5nZXRDb3Vyc2VTdWJNZW51KCdBcnF1aXZvcycpO1xuICAgIGNvbnN0IHRhYmxlID0gcGFnZS4kKCcubGlzdGluZycpO1xuICAgIGNvbnN0IHVzZWRGaWxlc0lkID0gW107XG4gICAgaWYgKHRhYmxlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgY29uc3Qgcm93cyA9IHRhYmxlLmZpbmQoJ3RyW2NsYXNzXScpLnRvQXJyYXkoKTtcbiAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgY2VsbHMgPSBwYWdlLiQocm93KS5jaGlsZHJlbigpO1xuICAgICAgICBjb25zdCB0aXRsZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGNlbGxzLmZpcnN0KCkuaHRtbCgpKTtcbiAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChjZWxscy5lcSgxKS5odG1sKCkpO1xuICAgICAgICBjb25zdCBidXR0b25FbGVtZW50ID0gY2VsbHMuZXEoMykuZmluZCgnYVtvbmNsaWNrXScpO1xuICAgICAgICBjb25zdCBidXR0b25PbmNsaWNrID0gYnV0dG9uRWxlbWVudC5hdHRyKCdvbmNsaWNrJyk7XG4gICAgICAgIGlmICghYnV0dG9uT25jbGljaylcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAnU0lHQUE6IEJ1dHRvbiBpbiB0aGUgZmlsZSB0YWJsZSBkb2VzIG5vdCBoYXZlIHRoZSBvbmNsaWNrIGV2ZW50LidcbiAgICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGZvcm0gPSBwYWdlLnBhcnNlSlNGQ0xKUyhidXR0b25PbmNsaWNrKTtcbiAgICAgICAgY29uc3QgaWQgPSBmb3JtLnBvc3RWYWx1ZXNbJ2lkJ107XG4gICAgICAgIGNvbnN0IGtleSA9IGZvcm0ucG9zdFZhbHVlc1sna2V5J107XG4gICAgICAgIGNvbnN0IGZpbGVPcHRpb25zID0ge1xuICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgICAgIGlkLFxuICAgICAgICAgIGtleSxcbiAgICAgICAgICBpbnN0YW5jZUluZGVudGlmaWVyOiBpZFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnJlc291cmNlcy5maWxlcy51cHNlcnQoZmlsZU9wdGlvbnMpO1xuICAgICAgICB1c2VkRmlsZXNJZC5wdXNoKGlkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZXNvdXJjZXMuZmlsZXMua2VlcE9ubHkodXNlZEZpbGVzSWQpO1xuICAgIHJldHVybiB0aGlzLnJlc291cmNlcy5maWxlcy5pbnN0YW5jZXM7XG4gIH1cblxuICAvKipcbiAgICogQGluaGVyaXRkb2NcbiAgICovXG4gIGFzeW5jIGdldEZvcnVtcygpOiBQcm9taXNlPENvdXJzZUZvcnVtW10+IHtcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5nZXRDb3Vyc2VTdWJNZW51KCdGw7NydW5zJyk7XG5cbiAgICBjb25zdCB0YWJsZSA9IHBhZ2UuJCgnLmxpc3RpbmcnKTtcbiAgICBjb25zdCB1c2VkRm9ydW1JZHM6IHN0cmluZ1tdID0gW107XG4gICAgaWYgKHRhYmxlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgbGV0IGZvcnVtc0lkSW5kZXggPSAwO1xuICAgICAgY29uc3Qgcm93cyA9IHRhYmxlLmZpbmQoJ3RyW2NsYXNzXScpLnRvQXJyYXkoKTtcbiAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgY2VsbHMgPSBwYWdlLiQocm93KS5jaGlsZHJlbigpO1xuICAgICAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBjZWxscy5maXJzdCgpLmZpbmQoJ2EnKTtcbiAgICAgICAgY29uc3QgdGl0bGUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbCh0aXRsZUVsZW1lbnQuaHRtbCgpKTtcbiAgICAgICAgY29uc3QgZm9ydW1UeXBlID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZXEoMSkuaHRtbCgpKTtcbiAgICAgICAgY29uc3QgbnVtT2ZUb3BpY3MgPSBwYXJzZUludChcbiAgICAgICAgICB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChjZWxscy5lcSgyKS5odG1sKCkpLFxuICAgICAgICAgIDEwXG4gICAgICAgICk7XG4gICAgICAgIGNvbnN0IGF1dGhvciA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGNlbGxzLmVxKDMpLmh0bWwoKSk7XG4gICAgICAgIGNvbnN0IGNyZWF0aW9uRGF0ZSA9IHRoaXMucGFyc2VyLnBhcnNlRGF0ZXMoXG4gICAgICAgICAgdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZXEoNCkuaHRtbCgpKSxcbiAgICAgICAgICAxXG4gICAgICAgIClbMF07XG4gICAgICAgIGNvbnN0IHRpdGxlT25DbGljayA9IHRpdGxlRWxlbWVudC5hdHRyKCdvbmNsaWNrJyk7XG4gICAgICAgIGlmICghdGl0bGVPbkNsaWNrKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEZvcnVtIHRpdGxlIGRvZXMgbm90IGhhdmUgb25jbGljayBldmVudC4nKTtcblxuICAgICAgICBjb25zdCBmb3JtID0gcGFnZS5wYXJzZUpTRkNMSlModGl0bGVPbkNsaWNrKTtcbiAgICAgICAgY29uc3QgaWQgPSBmb3J1bXNJZEluZGV4O1xuICAgICAgICBmb3J1bXNJZEluZGV4Kys7XG4gICAgICAgIGNvbnN0IGZvcnVtT3B0aW9uczogRm9ydW1EYXRhID0ge1xuICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgIGlkOiBpZC50b1N0cmluZygpLFxuICAgICAgICAgIGluc3RhbmNlSW5kZW50aWZpZXI6IGlkLnRvU3RyaW5nKCksXG4gICAgICAgICAgZm9ydW1UeXBlLFxuICAgICAgICAgIG51bU9mVG9waWNzOiBudW1PZlRvcGljcyxcbiAgICAgICAgICBhdXRob3IsXG4gICAgICAgICAgY3JlYXRpb25EYXRlLFxuICAgICAgICAgIGZvcm1cbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5yZXNvdXJjZXMuZm9ydW1zLnVwc2VydChmb3J1bU9wdGlvbnMpO1xuICAgICAgICB1c2VkRm9ydW1JZHMucHVzaChpZC50b1N0cmluZygpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZXNvdXJjZXMuZm9ydW1zLmtlZXBPbmx5KHVzZWRGb3J1bUlkcyk7XG4gICAgcmV0dXJuIHRoaXMucmVzb3VyY2VzLmZvcnVtcy5pbnN0YW5jZXM7XG4gIH1cblxuICAvKipcbiAgICogQGluaGVyaXRkb2NcbiAgICovXG4gIGFzeW5jIGdldE5ld3MoKTogUHJvbWlzZTxOZXdzW10+IHtcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5nZXRDb3Vyc2VTdWJNZW51KCdOb3TDrWNpYXMnKTtcbiAgICBjb25zdCB0YWJsZSA9IHBhZ2UuJCgnLmxpc3RpbmcnKTtcbiAgICBjb25zdCB1c2VkTmV3c0lkID0gW107XG4gICAgaWYgKHRhYmxlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgY29uc3Qgcm93cyA9IHRhYmxlLmZpbmQoJ3RyW2NsYXNzXScpLnRvQXJyYXkoKTtcbiAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgY29uc3QgY2VsbCA9IHBhZ2UuJChyb3cpLmNoaWxkcmVuKCk7XG4gICAgICAgIGNvbnN0IHRpdGxlID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbC5maXJzdCgpLmh0bWwoKSk7XG5cbiAgICAgICAgY29uc3QgYnV0dG9uRWxlbWVudCA9IGNlbGwuZXEoMikuY2hpbGRyZW4oKS5maXJzdCgpO1xuICAgICAgICBjb25zdCBidXR0b25PbkNsaWNrID0gYnV0dG9uRWxlbWVudC5hdHRyKCdvbmNsaWNrJyk7XG4gICAgICAgIGlmICghYnV0dG9uT25DbGljaylcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAnU0lHQUE6IE5ld3Mgb25jbGljayBidXR0b24gZG9lcyBub3QgaGF2ZSBvbmNsaWNrIGV2ZW50LidcbiAgICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IGZvcm0gPSBwYWdlLnBhcnNlSlNGQ0xKUyhidXR0b25PbkNsaWNrKTtcbiAgICAgICAgY29uc3QgaWQgPSBmb3JtLnBvc3RWYWx1ZXMuaWQ7XG4gICAgICAgIGNvbnN0IG5ld3NPcHRpb25zOiBOZXdzRGF0YSA9IHtcbiAgICAgICAgICB0aXRsZSxcbiAgICAgICAgICBmb3JtLFxuICAgICAgICAgIGlkLFxuICAgICAgICAgIGluc3RhbmNlSW5kZW50aWZpZXI6IGlkXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucmVzb3VyY2VzLm5ld3MudXBzZXJ0KG5ld3NPcHRpb25zKTtcbiAgICAgICAgdXNlZE5ld3NJZC5wdXNoKGlkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZXNvdXJjZXMubmV3cy5rZWVwT25seSh1c2VkTmV3c0lkKTtcbiAgICByZXR1cm4gdGhpcy5yZXNvdXJjZXMubmV3cy5pbnN0YW5jZXM7XG4gIH1cblxuICAvKipcbiAgICogQGluaGVyaXRkb2NcbiAgICovXG4gIGFzeW5jIGdldEFic2VuY2UoKTogUHJvbWlzZTxBYnNlbmNlTGlzdD4ge1xuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmdldENvdXJzZVN1Yk1lbnUoJ0ZyZXF1w6puY2lhJyk7XG4gICAgY29uc3QgdGFibGUgPSBwYWdlLiQoJy5saXN0aW5nJyk7XG4gICAgY29uc3QgYWJzZW5jZXM6IEFic2VuY2VEYXlbXSA9IFtdO1xuICAgIGNvbnN0IHJvd3MgPSB0YWJsZS5maW5kKCd0cltjbGFzc10nKS50b0FycmF5KCk7XG4gICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgY29uc3QgY2VsbHMgPSBwYWdlLiQocm93KS5jaGlsZHJlbigpO1xuICAgICAgY29uc3QgZGF0ZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGNlbGxzLmZpcnN0KCkuaHRtbCgpKTtcbiAgICAgIGNvbnN0IGFic2VuY2VTdHJpbmcgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChjZWxscy5lcSgxKS5odG1sKCkpO1xuICAgICAgbGV0IG51bU9mQWJzZW5jZXM7XG4gICAgICBpZiAoYWJzZW5jZVN0cmluZyA9PT0gJycgfHwgYWJzZW5jZVN0cmluZyA9PT0gJ07Do28gSW5mb3JtYWRhJykge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH0gZWxzZSBpZiAoYWJzZW5jZVN0cmluZyA9PT0gJ1ByZXNlbnRlJykge1xuICAgICAgICBudW1PZkFic2VuY2VzID0gMDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG51bU9mQWJzZW5jZXMgPSBwYXJzZUludChhYnNlbmNlU3RyaW5nLnJlcGxhY2UoL1xcRC9nbSwgJycpLCAxMCk7XG4gICAgICB9XG4gICAgICBhYnNlbmNlcy5wdXNoKHtcbiAgICAgICAgZGF0ZTogdGhpcy5wYXJzZXIucGFyc2VEYXRlcyhkYXRlLCAxKVswXSxcbiAgICAgICAgbnVtT2ZBYnNlbmNlc1xuICAgICAgfSk7XG4gICAgfVxuICAgIGNvbnN0IGRldGFpbHMgPSB0aGlzLnBhcnNlclxuICAgICAgLnJlbW92ZVRhZ3NIdG1sKHBhZ2UuJCgnLmJvdG9lcy1zaG93JykuaHRtbCgpKVxuICAgICAgLnNwbGl0KCdcXG4nKTtcblxuICAgIGxldCB0b3RhbEFic2VuY2VzLCBtYXhBYnNlbmNlcztcblxuICAgIGZvciAoY29uc3QgZGV0YWlsIG9mIGRldGFpbHMpIHtcbiAgICAgIGlmIChkZXRhaWwuaW5jbHVkZXMoJ1RvdGFsIGRlIEZhbHRhcycpKSB7XG4gICAgICAgIHRvdGFsQWJzZW5jZXMgPSBwYXJzZUludChkZXRhaWwucmVwbGFjZSgvXFxEL2dtLCAnJyksIDEwKTtcbiAgICAgIH0gZWxzZSBpZiAoZGV0YWlsLmluY2x1ZGVzKCdNw6F4aW1vIGRlIEZhbHRhcyBQZXJtaXRpZG8nKSkge1xuICAgICAgICBtYXhBYnNlbmNlcyA9IHBhcnNlSW50KGRldGFpbC5yZXBsYWNlKC9cXEQvZ20sICcnKSwgMTApO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmICh0eXBlb2YgbWF4QWJzZW5jZXMgIT09ICdudW1iZXInIHx8IHR5cGVvZiB0b3RhbEFic2VuY2VzICE9PSAnbnVtYmVyJylcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEludmFsaWQgYWJzZW5jZSBwYWdlIGZvcm1hdC4nKTtcblxuICAgIHJldHVybiB7XG4gICAgICBsaXN0OiBhYnNlbmNlcyxcbiAgICAgIHRvdGFsQWJzZW5jZXMsXG4gICAgICBtYXhBYnNlbmNlc1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogUGFyc2UgdGhlIHNpZGUgZXZhbHVhdGlvbiBjYXJkIGFuZCByZXR1cm5zIHRoZSBuYW1lIG9mIGVhY2ggZXZhbHVhdGlvbiBhbmQgdGhlIGRhdGUgaWYgaXQgaGFzXG4gICAqL1xuICBhc3luYyBnZXRFeGFtQ2FsZW5kYXIoKTogUHJvbWlzZTxFeGFtW10+IHtcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5yZXF1ZXN0Q291cnNlUGFnZSgpO1xuICAgIGNvbnN0IGNhcmQgPSBhd2FpdCB0aGlzLmdldFJpZ2h0U2lkZWJhckNhcmQocGFnZSwgJ0F2YWxpYcOnw7VlcycpO1xuICAgIGNvbnN0IGV4YW1FbGVtZW50cyA9IGNhcmQuZmluZCgnbGknKS50b0FycmF5KCk7XG4gICAgY29uc3QgZXhhbUxpc3Q6IEV4YW1bXSA9IFtdO1xuICAgIGNvbnN0IHllYXJTdHJpbmcgPSB0aGlzLnBlcmlvZC5zcGxpdCgnLicpWzBdO1xuICAgIGZvciAoY29uc3QgZXhhbUVsZW1lbnQgb2YgZXhhbUVsZW1lbnRzKSB7XG4gICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxuICAgICAgICBwYWdlLiQoZXhhbUVsZW1lbnQpLmZpbmQoJ3NwYW4uZGVzY3JpY2FvJykuaHRtbCgpXG4gICAgICApO1xuICAgICAgY29uc3QgZGF0ZUh0bWwgPSBwYWdlLiQoZXhhbUVsZW1lbnQpLmZpbmQoJ3NwYW4uZGF0YScpLmh0bWwoKTtcbiAgICAgIGNvbnN0IGRhdGVTdHJpbmcgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChkYXRlSHRtbCk7XG4gICAgICBsZXQgZGF0ZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGRhdGUgPSB0aGlzLnBhcnNlci5wYXJzZURhdGVzKFxuICAgICAgICAgIGRhdGVTdHJpbmcsXG4gICAgICAgICAgMSxcbiAgICAgICAgICBwYXJzZUludCh5ZWFyU3RyaW5nLCAxMClcbiAgICAgICAgKVswXTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGRhdGUgPSB0aGlzLnBhcnNlci5wYXJzZURhdGVzKGRhdGVTdHJpbmcsIDIpWzBdO1xuICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1lbXB0eVxuICAgICAgICB9IGNhdGNoIChlcnIpIHt9XG4gICAgICB9XG5cbiAgICAgIGV4YW1MaXN0LnB1c2goe1xuICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgZGF0ZVxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBleGFtTGlzdDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgYXN5bmMgZ2V0UXVpenplcygpOiBQcm9taXNlPFF1aXpbXT4ge1xuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmdldENvdXJzZVN1Yk1lbnUoJ1F1ZXN0aW9uw6FyaW9zJyk7XG5cbiAgICBjb25zdCB0YWJsZSA9IHBhZ2UuJCgnLmxpc3RpbmcnKTtcblxuICAgIGNvbnN0IHVzZWRRdWl6emVzSWRzID0gW107XG4gICAgaWYgKHRhYmxlLmxlbmd0aCA9PT0gMCkgcmV0dXJuIFtdO1xuICAgIGNvbnN0IHJvd3MgPSB0YWJsZS5maW5kKCd0cltjbGFzc10nKS50b0FycmF5KCk7XG5cbiAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICBjb25zdCBjZWxscyA9IHBhZ2UuJChyb3cpLmZpbmQoJ3RkJyk7XG4gICAgICBjb25zdCB0aXRsZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGNlbGxzLmZpcnN0KCkuaHRtbCgpKTtcbiAgICAgIGNvbnN0IHN0YXJ0RGF0ZSA9IHRoaXMucGFyc2VyLnBhcnNlRGF0ZXMoXG4gICAgICAgIHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGNlbGxzLmVxKDEpLmh0bWwoKSksXG4gICAgICAgIDFcbiAgICAgIClbMF07XG4gICAgICBjb25zdCBlbmREYXRlID0gdGhpcy5wYXJzZXIucGFyc2VEYXRlcyhcbiAgICAgICAgdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZXEoMikuaHRtbCgpKSxcbiAgICAgICAgMVxuICAgICAgKVswXTtcbiAgICAgIGNvbnN0IGJ1dHRvblNlbmRBbnN3ZXJzRWxlbWVudCA9IGNlbGxzLmVxKDMpLmZpbmQoJ2Fbb25jbGlja10nKTtcbiAgICAgIGxldCBmb3JtU2VuZEFuc3dlcnM7XG4gICAgICBpZiAoYnV0dG9uU2VuZEFuc3dlcnNFbGVtZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgYnV0dG9uT25jbGljayA9IGJ1dHRvblNlbmRBbnN3ZXJzRWxlbWVudC5hdHRyKCdvbmNsaWNrJyk7XG4gICAgICAgIGlmICghYnV0dG9uT25jbGljaylcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAnU0lHQUE6IHF1aXogYnV0dG9uIG9uY2xpY2sgZG9lcyBub3QgaGF2ZSBvbmNsaWNrIGV2ZW50LidcbiAgICAgICAgICApO1xuICAgICAgICBmb3JtU2VuZEFuc3dlcnMgPSBwYWdlLnBhcnNlSlNGQ0xKUyhidXR0b25PbmNsaWNrKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGJ1dHRvblZpZXdBbnN3ZXJzU3VibWl0dGVkRWxlbWVudCA9IGNlbGxzLmVxKDQpLmZpbmQoJ2Fbb25jbGlja10nKTtcbiAgICAgIGxldCBmb3JtVmlld0Fuc3dlcnNTdWJtaXR0ZWQ7XG4gICAgICBpZiAoYnV0dG9uVmlld0Fuc3dlcnNTdWJtaXR0ZWRFbGVtZW50Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgYnV0dG9uT25jbGljayA9IGJ1dHRvblZpZXdBbnN3ZXJzU3VibWl0dGVkRWxlbWVudC5hdHRyKCdvbmNsaWNrJyk7XG4gICAgICAgIGlmICghYnV0dG9uT25jbGljaylcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAnU0lHQUE6IHF1aXogYnV0dG9uIG9uY2xpY2sgZG9lcyBub3QgaGF2ZSBvbmNsaWNrIGV2ZW50LidcbiAgICAgICAgICApO1xuICAgICAgICBmb3JtVmlld0Fuc3dlcnNTdWJtaXR0ZWQgPSBwYWdlLnBhcnNlSlNGQ0xKUyhidXR0b25PbmNsaWNrKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGZvcm0gPSBmb3JtU2VuZEFuc3dlcnMgfHwgZm9ybVZpZXdBbnN3ZXJzU3VibWl0dGVkO1xuICAgICAgbGV0IGlkO1xuICAgICAgaWYgKCFmb3JtKSB7XG4gICAgICAgIGlmICghdGhpcy5yZXNvdXJjZXMubGVzc29ucy5pbnN0YW5jZXMubGVuZ3RoKSB7XG4gICAgICAgICAgYXdhaXQgdGhpcy5nZXRMZXNzb25zKCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcXVpeiA9IHRoaXMucmVzb3VyY2VzLnF1aXp6ZXMuaW5zdGFuY2VzLmZpbmQoXG4gICAgICAgICAgKHF1aXopID0+IHF1aXoudGl0bGUgPT09IHRpdGxlXG4gICAgICAgICk7XG4gICAgICAgIGlmIChxdWl6KSB7XG4gICAgICAgICAgaWQgPSBxdWl6LmlkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IE5vdCBmb3VuZCBxdWl6IGJ5IHRpdGxlLicpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZCA9IGZvcm0ucG9zdFZhbHVlcy5pZDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcXVpek9wdGlvbnM6IFF1aXpEYXRhID0ge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgc3RhcnREYXRlLFxuICAgICAgICBlbmREYXRlLFxuICAgICAgICBpZCxcbiAgICAgICAgaW5zdGFuY2VJbmRlbnRpZmllcjogaWQsXG4gICAgICAgIGZvcm1TZW5kQW5zd2VycyxcbiAgICAgICAgZm9ybVZpZXdBbnN3ZXJzU3VibWl0dGVkXG4gICAgICB9O1xuICAgICAgdGhpcy5yZXNvdXJjZXMucXVpenplcy51cHNlcnQocXVpek9wdGlvbnMpO1xuICAgICAgdXNlZFF1aXp6ZXNJZHMucHVzaChpZCk7XG4gICAgfVxuICAgIHRoaXMucmVzb3VyY2VzLnF1aXp6ZXMua2VlcE9ubHkodXNlZFF1aXp6ZXNJZHMpO1xuICAgIHJldHVybiB0aGlzLnJlc291cmNlcy5xdWl6emVzLmluc3RhbmNlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgYXN5bmMgZ2V0V2ViQ29udGVudHMoKTogUHJvbWlzZTxXZWJDb250ZW50W10+IHtcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5nZXRDb3Vyc2VTdWJNZW51KCdDb250ZcO6ZG8vUMOhZ2luYSB3ZWInKTtcblxuICAgIGNvbnN0IHRhYmxlID0gcGFnZS4kKCcubGlzdGluZycpO1xuXG4gICAgY29uc3QgdXNlZFdlYkNvbnRlbnRzSWRzID0gW107XG4gICAgaWYgKHRhYmxlLmxlbmd0aCAhPT0gMCkge1xuICAgICAgY29uc3Qgcm93cyA9IHRhYmxlLmZpbmQoJ3RyW2NsYXNzXScpLnRvQXJyYXkoKTtcblxuICAgICAgZm9yIChjb25zdCByb3cgb2Ygcm93cykge1xuICAgICAgICBjb25zdCBjZWxscyA9IHBhZ2UuJChyb3cpLmZpbmQoJ3RkJyk7XG4gICAgICAgIGNvbnN0IHRpdGxlID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZmlyc3QoKS5odG1sKCkpO1xuICAgICAgICBjb25zdCBkYXRlU3RyaW5nID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZXEoMSkuaHRtbCgpKTtcbiAgICAgICAgY29uc3QgZGF0ZSA9IHRoaXMucGFyc2VyLnBhcnNlRGF0ZXMoZGF0ZVN0cmluZywgMSlbMF07XG4gICAgICAgIGNvbnN0IGJ1dHRvbk9uY2xpY2sgPSBwYWdlXG4gICAgICAgICAgLiQoY2VsbHNbMl0pXG4gICAgICAgICAgLmZpbmQoJ2Fbb25jbGlja10nKVxuICAgICAgICAgIC5hdHRyKCdvbmNsaWNrJyk7XG5cbiAgICAgICAgaWYgKCFidXR0b25PbmNsaWNrKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdTSUdBQTogV2ViY29udGVudCBoYXMgYnV0dG9uIHdpdGhvdXQgb25jbGljayBldmVudC4nXG4gICAgICAgICAgKTtcblxuICAgICAgICBjb25zdCBmb3JtID0gcGFnZS5wYXJzZUpTRkNMSlMoYnV0dG9uT25jbGljayk7XG4gICAgICAgIGNvbnN0IGlkID0gZm9ybS5wb3N0VmFsdWVzLmlkO1xuICAgICAgICBjb25zdCB3ZWJDb250ZW50T3B0aW9uczogV2ViQ29udGVudERhdGEgPSB7XG4gICAgICAgICAgdGl0bGUsXG4gICAgICAgICAgZGF0ZSxcbiAgICAgICAgICBmb3JtLFxuICAgICAgICAgIGlkLFxuICAgICAgICAgIGluc3RhbmNlSW5kZW50aWZpZXI6IGlkXG4gICAgICAgIH07XG4gICAgICAgIHRoaXMucmVzb3VyY2VzLndlYkNvbnRlbnRzLnVwc2VydCh3ZWJDb250ZW50T3B0aW9ucyk7XG4gICAgICAgIHVzZWRXZWJDb250ZW50c0lkcy5wdXNoKGlkKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5yZXNvdXJjZXMud2ViQ29udGVudHMua2VlcE9ubHkodXNlZFdlYkNvbnRlbnRzSWRzKTtcbiAgICByZXR1cm4gdGhpcy5yZXNvdXJjZXMud2ViQ29udGVudHMuaW5zdGFuY2VzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0ZG9jXG4gICAqL1xuICBhc3luYyBnZXRTdXJ2ZXlzKCk6IFByb21pc2U8U2lnYWFTdXJ2ZXlbXT4ge1xuICAgIC8vIFRPRE9cbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBnZXRTdXJ2ZXlzIG5vdCBpbXBsZW1lbnRlZC4nKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgYXN5bmMgZ2V0SG9tZXdvcmtzKCk6IFByb21pc2U8SG9tZXdvcmtbXT4ge1xuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmdldENvdXJzZVN1Yk1lbnUoJ1RhcmVmYXMnKTtcbiAgICBjb25zdCB0YWJsZXMgPSBwYWdlLiQoJy5saXN0aW5nJykudG9BcnJheSgpO1xuICAgIGlmICghdGFibGVzKSByZXR1cm4gW107XG4gICAgY29uc3QgdXNlZEhvbWV3b3Jrc0lkcyA9IFtdO1xuICAgIGZvciAoY29uc3QgdGFibGUgb2YgdGFibGVzKSB7XG4gICAgICAvL0lmIHRhYmxlIHRpdGxlIGlzICdUYXJlZmFzIEVtIEdydXBvJ1xuICAgICAgY29uc3QgaXNHcm91cEhvbWV3b3JrID1cbiAgICAgICAgdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwocGFnZS4kKHRhYmxlKS5zaWJsaW5ncygnbGVnZW5kJykuaHRtbCgpKSA9PT1cbiAgICAgICAgJ1RhcmVmYXMgRW0gR3J1cG8nO1xuXG4gICAgICBjb25zdCByb3dzID0gcGFnZS4kKHRhYmxlKS5maW5kKCd0cltjbGFzc10nKS50b0FycmF5KCk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcm93cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgICBjb25zdCBjZWxscyA9IHBhZ2UuJChyb3dzW2ldKS5maW5kKCd0ZCcpO1xuICAgICAgICBjb25zdCBjZWxsRGVzY3JpcHRpb24gPSBwYWdlLiQocm93c1tpICsgMV0pLmZpbmQoJ3RkJyk7XG4gICAgICAgIGNvbnN0IHRpdGxlID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoY2VsbHMuZXEoMSkuaHRtbCgpKTtcbiAgICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChjZWxsRGVzY3JpcHRpb24uaHRtbCgpKTtcbiAgICAgICAgY29uc3QgZGF0ZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGNlbGxzLmVxKDIpLmh0bWwoKSk7XG4gICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5wYXJzZXIucGFyc2VEYXRlcyhkYXRlLCAyKTtcbiAgICAgICAgY29uc3QgaGF2ZUdyYWRlID1cbiAgICAgICAgICB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChjZWxscy5lcSgzKS5odG1sKCkpICE9PSAnTsOjbyc7XG5cbiAgICAgICAgY29uc3QgYnV0dG9uU2VuZEhvbWV3b3JrRWxlbWVudCA9IHBhZ2UuJChcbiAgICAgICAgICBjZWxscy5lcSg1KS5maW5kKCdhW29uY2xpY2tdJylcbiAgICAgICAgKTtcbiAgICAgICAgbGV0IGZvcm1TZW5kSG9tZXdvcms7XG4gICAgICAgIGlmIChidXR0b25TZW5kSG9tZXdvcmtFbGVtZW50Lmxlbmd0aCAhPT0gMCkge1xuICAgICAgICAgIGNvbnN0IG9uQ2xpY2sgPSBidXR0b25TZW5kSG9tZXdvcmtFbGVtZW50LmF0dHIoJ29uY2xpY2snKTtcbiAgICAgICAgICBpZiAoIW9uQ2xpY2spXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICdTSUdBQTogQnV0dG9uIHNlbmQgaG9tZXdvcmsgd2l0aG91dCBvbmNsaWNrIGV2ZW50LidcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgZm9ybVNlbmRIb21ld29yayA9IHBhZ2UucGFyc2VKU0ZDTEpTKG9uQ2xpY2spO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGJ1dHRvblZpZXdIb21ld29ya1N1Ym1pdHRlZEVsZW1lbnQgPSBwYWdlLiQoXG4gICAgICAgICAgY2VsbHMuZXEoNikuZmluZCgnYVtvbmNsaWNrXScpXG4gICAgICAgICk7XG4gICAgICAgIGxldCBmb3JtVmlld0hvbWV3b3JrU3VibWl0dGVkO1xuICAgICAgICBpZiAoYnV0dG9uVmlld0hvbWV3b3JrU3VibWl0dGVkRWxlbWVudC5sZW5ndGggIT09IDApIHtcbiAgICAgICAgICBjb25zdCBvbkNsaWNrID0gYnV0dG9uVmlld0hvbWV3b3JrU3VibWl0dGVkRWxlbWVudC5hdHRyKCdvbmNsaWNrJyk7XG4gICAgICAgICAgaWYgKCFvbkNsaWNrKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICAnU0lHQUE6IEJ1dHRvbiB2aWV3IGhvbWV3b3JrIHdpdGhvdXQgb25jbGljayBldmVudC4nXG4gICAgICAgICAgICApO1xuICAgICAgICAgIGZvcm1WaWV3SG9tZXdvcmtTdWJtaXR0ZWQgPSBwYWdlLnBhcnNlSlNGQ0xKUyhvbkNsaWNrKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBmb3JtID0gZm9ybVNlbmRIb21ld29yayB8fCBmb3JtVmlld0hvbWV3b3JrU3VibWl0dGVkO1xuICAgICAgICBsZXQgaWQ6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgbGV0IGluc3RhbmNlSW5kZW50aWZpZXI6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgICAgICAgaWYgKCFmb3JtKSB7XG4gICAgICAgICAgaWYgKCF0aGlzLnJlc291cmNlcy5sZXNzb25zLmluc3RhbmNlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuZ2V0TGVzc29ucygpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGhvbWV3b3JrTGlzdCA9IHRoaXMucmVzb3VyY2VzLmhvbWV3b3JrLmluc3RhbmNlcy5maWx0ZXIoXG4gICAgICAgICAgICAoaG9tZXdvcmspID0+IGhvbWV3b3JrLnRpdGxlID09PSB0aXRsZVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBpZiAoaG9tZXdvcmtMaXN0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgJ1NJR0FBOiBUaGVyZSBpcyBtb3JlIHRoYW4gb25lIGhvbWV3b3JrIHdpdGggc2FtZSB0aXRsZSBhbmQgd2l0aG91dCBpZC4nXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSBpZiAoaG9tZXdvcmtMaXN0Lmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICBpZCA9IGhvbWV3b3JrTGlzdFswXS5faW5zdGFuY2VJbmRlbnRpZmllcjtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5zdGFuY2VJbmRlbnRpZmllciA9ICdfJyArIHRpdGxlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZCA9IGZvcm0ucG9zdFZhbHVlcy5pZDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICBpbnN0YW5jZUluZGVudGlmaWVyID0gaWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluc3RhbmNlSW5kZW50aWZpZXIpIHtcbiAgICAgICAgICBjb25zdCBob21ld29ya09wdGlvbnM6IEhvbWV3b3JrRGF0YSA9IHtcbiAgICAgICAgICAgIHRpdGxlLFxuICAgICAgICAgICAgc3RhcnREYXRlOiBkYXRlc1swXSxcbiAgICAgICAgICAgIGVuZERhdGU6IGRhdGVzWzFdLFxuICAgICAgICAgICAgZGVzY3JpcHRpb24sXG4gICAgICAgICAgICBpc0dyb3VwSG9tZXdvcmssXG4gICAgICAgICAgICBpZCxcbiAgICAgICAgICAgIGluc3RhbmNlSW5kZW50aWZpZXIsXG4gICAgICAgICAgICBmb3JtU2VuZEhvbWV3b3JrLFxuICAgICAgICAgICAgZm9ybVZpZXdIb21ld29ya1N1Ym1pdHRlZCxcbiAgICAgICAgICAgIGhhdmVHcmFkZVxuICAgICAgICAgIH07XG4gICAgICAgICAgdGhpcy5yZXNvdXJjZXMuaG9tZXdvcmsudXBzZXJ0KGhvbWV3b3JrT3B0aW9ucyk7XG4gICAgICAgICAgdXNlZEhvbWV3b3Jrc0lkcy5wdXNoKGluc3RhbmNlSW5kZW50aWZpZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMucmVzb3VyY2VzLmhvbWV3b3JrLmtlZXBPbmx5KHVzZWRIb21ld29ya3NJZHMpO1xuXG4gICAgcmV0dXJuIHRoaXMucmVzb3VyY2VzLmhvbWV3b3JrLmluc3RhbmNlcztcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgYXN5bmMgZ2V0TWVtYmVycygpOiBQcm9taXNlPE1lbWJlckxpc3Q+IHtcbiAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5nZXRDb3Vyc2VTdWJNZW51KCdQYXJ0aWNpcGFudGVzJyk7XG5cbiAgICBjb25zdCB0YWJsZXMgPSBwYWdlLiQoJ3RhYmxlLnBhcnRpY2lwYW50ZXMnKS50b0FycmF5KCk7XG4gICAgY29uc3QgdGFibGVzTmFtZXMgPSBwYWdlLiQoJ2ZpZWxkc2V0JykudG9BcnJheSgpO1xuICAgIGlmICh0YWJsZXMubGVuZ3RoICE9PSB0YWJsZXNOYW1lcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFVuZXhwZWN0ZWQgcGFnZSBtZW1iZXJzIGZvcm1hdC4nKTtcbiAgICB9XG4gICAgbGV0IHRhYmxlVGVhY2hlcjtcbiAgICBsZXQgdGFibGVTdHVkZW50O1xuICAgIHRhYmxlc05hbWVzLmZvckVhY2goKHZhbHVlLCBpbmRleCkgPT4ge1xuICAgICAgY29uc3QgbGFiZWwgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChwYWdlLiQodmFsdWUpLmh0bWwoKSk7XG4gICAgICBpZiAobGFiZWwuaW5jbHVkZXMoJ1Byb2Zlc3NvcmVzJykpIHRhYmxlVGVhY2hlciA9IHRhYmxlc1tpbmRleF07XG4gICAgICBlbHNlIGlmIChsYWJlbC5pbmNsdWRlcygnQWx1bm9zJykpIHRhYmxlU3R1ZGVudCA9IHRhYmxlc1tpbmRleF07XG4gICAgfSk7XG4gICAgY29uc3QgdGVhY2hlcnM6IFRlYWNoZXJbXSA9IFtdO1xuICAgIGlmICh0YWJsZVRlYWNoZXIpIHtcbiAgICAgIGNvbnN0IHRlYWNoZXJFbGVtZW50cyA9IHBhZ2UuJCh0YWJsZVRlYWNoZXIpLmZpbmQoJ3RyJykudG9BcnJheSgpO1xuICAgICAgZm9yIChjb25zdCB0ZWFjaGVyRWxlbWVudCBvZiB0ZWFjaGVyRWxlbWVudHMpIHtcbiAgICAgICAgbGV0IGRlcGFydG1lbnQ7XG4gICAgICAgIGxldCBmb3JtYXRpb247XG4gICAgICAgIGxldCB1c2VybmFtZTtcbiAgICAgICAgbGV0IGVtYWlsO1xuICAgICAgICBjb25zdCBpbmZvcm1hdGlvbnNTdHJpbmcgPVxuICAgICAgICAgIHBhZ2UuJCh0ZWFjaGVyRWxlbWVudCkuZmluZCgndGRbdmFsaWduXScpLmh0bWwoKSB8fCAnJztcbiAgICAgICAgY29uc3QgaW5mb3JtYXRpb25zID0gaW5mb3JtYXRpb25zU3RyaW5nLnNwbGl0KCc8YnI+Jykuc2xpY2UoMSwgLTEpO1xuICAgICAgICBmb3IgKGNvbnN0IGluZm9ybWF0aW9uIG9mIGluZm9ybWF0aW9ucykge1xuICAgICAgICAgIGNvbnN0IGxhYmVsID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXG4gICAgICAgICAgICAoaW5mb3JtYXRpb24ubWF0Y2goL15bXFxzXFxTXSo/KD89OltcXHNdKj88ZW0+KS9nKSB8fCBbXSlbMF1cbiAgICAgICAgICApO1xuICAgICAgICAgIGNvbnN0IGluZm9ybWF0aW9uQ29udGVudCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxuICAgICAgICAgICAgKGluZm9ybWF0aW9uLm1hdGNoKC8oPz08ZW0+KVtcXHNcXFNdKj8oPz08XFwvZW0+KS9nKSB8fCBbXSlbMF1cbiAgICAgICAgICApO1xuICAgICAgICAgIHN3aXRjaCAobGFiZWwpIHtcbiAgICAgICAgICAgIGNhc2UgJ0RlcGFydGFtZW50byc6XG4gICAgICAgICAgICAgIGRlcGFydG1lbnQgPSBpbmZvcm1hdGlvbkNvbnRlbnQ7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAnRm9ybWHDp8Ojbyc6XG4gICAgICAgICAgICAgIGZvcm1hdGlvbiA9IGluZm9ybWF0aW9uQ29udGVudDtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdVc3XDoXJpbyc6XG4gICAgICAgICAgICAgIHVzZXJuYW1lID0gaW5mb3JtYXRpb25Db250ZW50O1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ0UtbWFpbCc6XG4gICAgICAgICAgICBjYXNlICdFLU1haWwnOlxuICAgICAgICAgICAgICBlbWFpbCA9IGluZm9ybWF0aW9uQ29udGVudDtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAnV0FSTklORzpUZWFjaGVyIGluZm9ybWF0aW9uIGxhYmVsIG5vdCByZWNvZ25pemVkOicgKyBsYWJlbFxuICAgICAgICAgICAgICApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjb25zdCBuYW1lID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXG4gICAgICAgICAgcGFnZS4kKHRlYWNoZXJFbGVtZW50KS5maW5kKCdzdHJvbmcgPiBhJykuaHRtbCgpXG4gICAgICAgICk7XG4gICAgICAgIGlmICghdXNlcm5hbWUgfHwgIWVtYWlsKVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEludmFsaWQgdGVhY2hlciBmb3JtYXQgYXQgbWVtYmVyIHBhZ2UuJyk7XG4gICAgICAgIGNvbnN0IHRlYWNoZXI6IFRlYWNoZXIgPSB7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICB1c2VybmFtZSxcbiAgICAgICAgICBkZXBhcnRtZW50LFxuICAgICAgICAgIGZvcm1hdGlvbixcbiAgICAgICAgICBlbWFpbFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBwaG90b0hSRUYgPSBwYWdlLiQodGVhY2hlckVsZW1lbnQpLmZpbmQoJ2ltZycpLmF0dHIoJ3NyYycpO1xuICAgICAgICBpZiAoIXBob3RvSFJFRilcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAnU0lHQUE6IHRlYWNoZXIgcHJvZmlsZSBwaWN0dXJlIHdpdGhvdXQgc3JjIGF0IG1lbWJlciBwYWdlLidcbiAgICAgICAgICApO1xuXG4gICAgICAgIGNvbnN0IHBob3RvVVJMID0gbmV3IFVSTChwaG90b0hSRUYsIHBhZ2UudXJsLmhyZWYpO1xuICAgICAgICBpZiAoIXBob3RvVVJMLmhyZWYuaW5jbHVkZXMoJ25vX3BpY3R1cmUucG5nJykpIHtcbiAgICAgICAgICB0ZWFjaGVyLnBob3RvVVJMID0gcGhvdG9VUkw7XG4gICAgICAgIH1cblxuICAgICAgICB0ZWFjaGVycy5wdXNoKHRlYWNoZXIpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHN0dWRlbnRzOiBTdHVkZW50W10gPSBbXTtcbiAgICBpZiAodGFibGVTdHVkZW50KSB7XG4gICAgICBjb25zdCByb3dzID0gcGFnZS4kKHRhYmxlU3R1ZGVudCkuZmluZCgndHInKS50b0FycmF5KCk7XG4gICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgIGNvbnN0IG51bWJlck9mQ29sdW1uID0gcGFnZS4kKHJvdykuZmluZCgndGRbdmFsaWduXScpLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgY29sdW1uID0gMDsgY29sdW1uIDwgbnVtYmVyT2ZDb2x1bW47IGNvbHVtbisrKSB7XG4gICAgICAgICAgY29uc3QgaW5mb3JtYXRpb25zU3RyaW5nID1cbiAgICAgICAgICAgIHBhZ2UuJChyb3cpLmZpbmQoJ3RkW3ZhbGlnbl0nKS5lcShjb2x1bW4pLmh0bWwoKSB8fCAnJztcbiAgICAgICAgICBjb25zdCBpbmZvcm1hdGlvbnMgPSBpbmZvcm1hdGlvbnNTdHJpbmcuc3BsaXQoJzxicj4nKS5zbGljZSgxKTtcbiAgICAgICAgICBsZXQgcmVnaXN0cmF0aW9uO1xuICAgICAgICAgIGxldCB1c2VybmFtZTtcbiAgICAgICAgICBsZXQgcHJvZ3JhbTtcbiAgICAgICAgICBsZXQgcmVnaXN0cmF0aW9uRGF0ZTtcbiAgICAgICAgICBsZXQgZW1haWw7XG4gICAgICAgICAgZm9yIChjb25zdCBpbmZvcm1hdGlvbiBvZiBpbmZvcm1hdGlvbnMpIHtcbiAgICAgICAgICAgIGNvbnN0IGxhYmVsID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXG4gICAgICAgICAgICAgIChpbmZvcm1hdGlvbi5tYXRjaCgvXltcXHNcXFNdKj8oPz06W1xcc10qPzxlbT4pL2cpIHx8IFtdKVswXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnN0IGluZm9ybWF0aW9uQ29udGVudCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxuICAgICAgICAgICAgICAoaW5mb3JtYXRpb24ubWF0Y2goLyg/PTxlbT4pW1xcc1xcU10qPyg/PTxcXC9lbT4pL2cpIHx8IFtdKVswXVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHN3aXRjaCAobGFiZWwpIHtcbiAgICAgICAgICAgICAgY2FzZSAnTWF0csOtY3VsYSc6IHtcbiAgICAgICAgICAgICAgICByZWdpc3RyYXRpb24gPSBpbmZvcm1hdGlvbkNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY2FzZSAnVXN1w6FyaW8nOiB7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWUgPSBpbmZvcm1hdGlvbkNvbnRlbnQ7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY2FzZSAnQ3Vyc28nOiB7XG4gICAgICAgICAgICAgICAgcHJvZ3JhbSA9IGluZm9ybWF0aW9uQ29udGVudDtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjYXNlICdEYXRhIE1hdHLDrWN1bGEnOiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaW5mb3JtYXRpb25EYXRlU3BsaXRlZCA9IGluZm9ybWF0aW9uQ29udGVudC5zcGxpdCgnLScpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHllYXIgPSBwYXJzZUludChpbmZvcm1hdGlvbkRhdGVTcGxpdGVkWzJdLCAxMCk7XG4gICAgICAgICAgICAgICAgY29uc3QgbW9udGggPSBwYXJzZUludChpbmZvcm1hdGlvbkRhdGVTcGxpdGVkWzFdLCAxMCkgLSAxO1xuICAgICAgICAgICAgICAgIGNvbnN0IGRheSA9IHBhcnNlSW50KGluZm9ybWF0aW9uRGF0ZVNwbGl0ZWRbMF0sIDEwKTtcbiAgICAgICAgICAgICAgICByZWdpc3RyYXRpb25EYXRlID0gbmV3IERhdGUoeWVhciwgbW9udGgsIGRheSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY2FzZSAnRS1tYWlsJzpcbiAgICAgICAgICAgICAgY2FzZSAnRS1NYWlsJzoge1xuICAgICAgICAgICAgICAgIGVtYWlsID0gaW5mb3JtYXRpb25Db250ZW50O1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcbiAgICAgICAgICAgICAgICAgICdXQVJOSU5HOlN0dWRlbnQgaW5mb3JtYXRpb24gbGFiZWwgbm90IHJlY29nbml6ZWQ6JyArIGxhYmVsXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICF1c2VybmFtZSB8fFxuICAgICAgICAgICAgIWVtYWlsIHx8XG4gICAgICAgICAgICAhcmVnaXN0cmF0aW9uRGF0ZSB8fFxuICAgICAgICAgICAgIXJlZ2lzdHJhdGlvbiB8fFxuICAgICAgICAgICAgIXByb2dyYW1cbiAgICAgICAgICApXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBJbnZhbGlkIHN0dWRlbnQgZm9ybWF0IGF0IG1lbWJlciBwYWdlLicpO1xuXG4gICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKFxuICAgICAgICAgICAgcGFnZS4kKHJvdykuZmluZCgnc3Ryb25nJykuZXEoY29sdW1uKS5odG1sKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgY29uc3Qgc3R1ZGVudDogU3R1ZGVudCA9IHtcbiAgICAgICAgICAgIG5hbWUsXG4gICAgICAgICAgICB1c2VybmFtZSxcbiAgICAgICAgICAgIHByb2dyYW0sXG4gICAgICAgICAgICByZWdpc3RyYXRpb24sXG4gICAgICAgICAgICByZWdpc3RyYXRpb25EYXRlLFxuICAgICAgICAgICAgZW1haWxcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgY29uc3QgcGhvdG9IUkVGID0gcGFnZVxuICAgICAgICAgICAgLiQocm93KVxuICAgICAgICAgICAgLmZpbmQoJ3RkW3dpZHRoPVwiNDdcIl0gaW1nJylcbiAgICAgICAgICAgIC5lcShjb2x1bW4pXG4gICAgICAgICAgICAuYXR0cignc3JjJyk7XG4gICAgICAgICAgaWYgKCFwaG90b0hSRUYpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgICdTSUdBQTogc3R1ZGVudCBwcm9maWxlIHBpY3R1cmUgd2l0aG91dCBzcmMgYXQgbWVtYmVyIHBhZ2UuJ1xuICAgICAgICAgICAgKTtcblxuICAgICAgICAgIGNvbnN0IHBob3RvVVJMID0gbmV3IFVSTChwaG90b0hSRUYsIHBhZ2UudXJsLmhyZWYpO1xuICAgICAgICAgIGlmICghcGhvdG9VUkwuaHJlZi5pbmNsdWRlcygnbm9fcGljdHVyZS5wbmcnKSkge1xuICAgICAgICAgICAgc3R1ZGVudC5waG90b1VSTCA9IHBob3RvVVJMO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHN0dWRlbnRzLnB1c2goc3R1ZGVudCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgdGVhY2hlcnMsXG4gICAgICBzdHVkZW50c1xuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQGluaGVyaXRkb2NcbiAgICovXG4gIGFzeW5jIGdldEdyYWRlcyhyZXRyeSA9IHRydWUpOiBQcm9taXNlPEdyYWRlR3JvdXBbXT4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBwYWdlID0gYXdhaXQgdGhpcy5nZXRDb3Vyc2VTdWJNZW51KCdWZXIgTm90YXMnLCByZXRyeSk7XG4gICAgICBjb25zdCBnZXRQb3NpdGlvbkJ5Q2VsbENvbFNwYW4gPSAoXG4gICAgICAgIHRoczogY2hlZXJpby5DaGVlcmlvLFxuICAgICAgICBjZWxsOiBjaGVlcmlvLkVsZW1lbnRcbiAgICAgICkgPT4ge1xuICAgICAgICBsZXQgaSA9IDA7XG4gICAgICAgIGZvciAoY29uc3QgdHIgb2YgdGhzLnRvQXJyYXkoKSkge1xuICAgICAgICAgIGlmIChjZWxsID09PSB0cikge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGkgKz0gcGFyc2VJbnQocGFnZS4kKHRyKS5hdHRyKCdjb2xzcGFuJykgfHwgJzEnLCAxMCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogSW52YWxpZCBncmFkZSB0YWJsZS4nKTtcbiAgICAgIH07XG5cbiAgICAgIGNvbnN0IHJlbW92ZUNlbGxzV2l0aE5hbWUgPSBbJycsICdNYXRyw61jdWxhJywgJ05vbWUnLCAnU2l0LicsICdGYWx0YXMnXTtcblxuICAgICAgY29uc3QgdGFibGUgPSBwYWdlLiQoJ3RhYmxlLnRhYmVsYVJlbGF0b3JpbycpO1xuICAgICAgaWYgKHRhYmxlLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgLy8gQ291cnNlIHdpdGhvdXQgZ3JhZGVzIHJlbGVhc2VkIHlldFxuICAgICAgICBpZiAoL25bYcOjXW8gKGZvcmFtfGhbYcOhXSkgKGxhbltjw6ddYWR8bm90YXMpfG5lbmh1bWEgbm90YS9pLnRlc3QoXG4gICAgICAgICAgcGFnZS5ib2R5RGVjb2RlZFxuICAgICAgICApKVxuICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgc2F2ZURlYnVnUGFnZSgndHVybWEtbm90YXMnLCBwYWdlKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogUmVjZWl2ZWQgZW1wdHkgdGFibGUgb24gZ3JhZGUgcGFnZS4nKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGhlYWRUcnMgPSBwYWdlLiQoJ3RoZWFkIHRyJykudG9BcnJheSgpO1xuICAgICAgY29uc3QgdmFsdWVDZWxscyA9IHBhZ2UuJCh0YWJsZSkuZmluZCgndGJvZHkgdHInKS5jaGlsZHJlbigpO1xuICAgICAgaWYgKHZhbHVlQ2VsbHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFBhZ2UgZ3JhZGVzIHdpdGhvdXQgZ3JhZGVzLicpO1xuICAgICAgfVxuICAgICAgY29uc3QgZ3JhZGVzOiBHcmFkZUdyb3VwW10gPSBbXTtcblxuICAgICAgY29uc3QgdGhlYWRFbGVtZW50czogY2hlZXJpby5DaGVlcmlvW10gPSBbXTtcbiAgICAgIGZvciAoY29uc3QgdGhlYWRUciBvZiB0aGVhZFRycykge1xuICAgICAgICB0aGVhZEVsZW1lbnRzLnB1c2gocGFnZS4kKHRoZWFkVHIpLmZpbmQoJ3RoJykpO1xuICAgICAgfVxuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoZWFkRWxlbWVudHNbMF0ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZ3JhZGVHcm91cE5hbWUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcbiAgICAgICAgICB0aGVhZEVsZW1lbnRzWzBdLmVxKGkpLmh0bWwoKVxuICAgICAgICApO1xuICAgICAgICBpZiAocmVtb3ZlQ2VsbHNXaXRoTmFtZS5pbmRleE9mKGdyYWRlR3JvdXBOYW1lKSAhPT0gLTEpIGNvbnRpbnVlO1xuICAgICAgICBjb25zdCBpbmRleCA9IGdldFBvc2l0aW9uQnlDZWxsQ29sU3BhbihcbiAgICAgICAgICB0aGVhZEVsZW1lbnRzWzBdLFxuICAgICAgICAgIHRoZWFkRWxlbWVudHNbMF1baV1cbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgdGhlYWRFbGVtZW50Q29sc3BhbiA9IHBhcnNlSW50KFxuICAgICAgICAgIHRoZWFkRWxlbWVudHNbMF0uZXEoaSkuYXR0cignY29sc3BhbicpIHx8ICcxJyxcbiAgICAgICAgICAxMFxuICAgICAgICApO1xuICAgICAgICBsZXQgdHlwZTpcbiAgICAgICAgICB8ICd3ZWlnaHRlZC1hdmVyYWdlJ1xuICAgICAgICAgIHwgJ2FyaXRobWV0aWMtYXZlcmFnZSdcbiAgICAgICAgICB8ICdzdW0tb2YtZ3JhZGVzJ1xuICAgICAgICAgIHwgJ29ubHktYXZlcmFnZSc7XG4gICAgICAgIGNvbnN0IGdyYWRlVHlwZSA9IHBhZ2UuJChgI3RpcG9VbmlkJHtpfWApLnZhbCgpO1xuICAgICAgICBzd2l0Y2ggKGdyYWRlVHlwZSkge1xuICAgICAgICAgIGNhc2UgJ1AnOlxuICAgICAgICAgICAgdHlwZSA9ICd3ZWlnaHRlZC1hdmVyYWdlJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgJ0EnOlxuICAgICAgICAgICAgdHlwZSA9ICdhcml0aG1ldGljLWF2ZXJhZ2UnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAnUyc6XG4gICAgICAgICAgICB0eXBlID0gJ3N1bS1vZi1ncmFkZXMnO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIHR5cGUgPSAnb25seS1hdmVyYWdlJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlID09PSAnb25seS1hdmVyYWdlJyB8fCB0aGVhZEVsZW1lbnRDb2xzcGFuID09IDEpIHtcbiAgICAgICAgICBjb25zdCB2YWx1ZVN0cmluZyA9IHRoaXMucGFyc2VyXG4gICAgICAgICAgICAucmVtb3ZlVGFnc0h0bWwodmFsdWVDZWxscy5lcShpbmRleCkuaHRtbCgpKVxuICAgICAgICAgICAgLnJlcGxhY2UoLywvZywgJy4nKTtcbiAgICAgICAgICBsZXQgdmFsdWU7XG4gICAgICAgICAgaWYgKHZhbHVlU3RyaW5nLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhbHVlID0gcGFyc2VGbG9hdCh2YWx1ZVN0cmluZyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGdyYWRlcy5wdXNoKHtcbiAgICAgICAgICAgIG5hbWU6IGdyYWRlR3JvdXBOYW1lLFxuICAgICAgICAgICAgdmFsdWUsXG4gICAgICAgICAgICB0eXBlOiAnb25seS1hdmVyYWdlJ1xuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGdyYWRlc1N1bU9mR3JhZGVzOiBTdWJHcmFkZVN1bU9mR3JhZGVzW10gPSBbXTtcbiAgICAgICAgICBjb25zdCBncmFkZXNXZWlnaHRlZDogU3ViR3JhZGVXZWlnaHRlZEF2ZXJhZ2VbXSA9IFtdO1xuICAgICAgICAgIGNvbnN0IGdyYWRlc0FyaXRobWV0aWM6IFN1YkdyYWRlQXJpdGhtZXRpY0F2ZXJhZ2VbXSA9IFtdO1xuXG4gICAgICAgICAgZm9yIChsZXQgaiA9IGluZGV4OyBqIDwgaW5kZXggKyB0aGVhZEVsZW1lbnRDb2xzcGFuOyBqKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGZ1bGxJZCA9IHRoZWFkRWxlbWVudHNbMV0uZXEoaikuYXR0cignaWQnKTtcbiAgICAgICAgICAgIGlmICghZnVsbElkKSB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBHcmFkZSB3aXRob3V0IGlkLicpO1xuICAgICAgICAgICAgY29uc3QgZ3JhZGVJZCA9IGZ1bGxJZC5zbGljZSg1KTtcblxuICAgICAgICAgICAgaWYgKGdyYWRlSWQgIT09ICcnKSB7XG4gICAgICAgICAgICAgIGNvbnN0IGdyYWRlTmFtZSA9IHBhZ2UuJChgaW5wdXQjZGVuQXZhbF8ke2dyYWRlSWR9YCkudmFsKCk7XG4gICAgICAgICAgICAgIGNvbnN0IGdyYWRlQ29kZSA9IHBhZ2UuJChgaW5wdXQjYWJyZXZBdmFsXyR7Z3JhZGVJZH1gKS52YWwoKTtcblxuICAgICAgICAgICAgICBsZXQgdmFsdWU6IG51bWJlciB8IHVuZGVmaW5lZCA9IHBhcnNlRmxvYXQoXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZXJcbiAgICAgICAgICAgICAgICAgIC5yZW1vdmVUYWdzSHRtbCh2YWx1ZUNlbGxzLmVxKGopLmh0bWwoKSlcbiAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8sL2csICcuJylcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkgdmFsdWUgPSB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdzdW0tb2YtZ3JhZGVzJykge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1heFZhbHVlID0gcGFyc2VGbG9hdChcbiAgICAgICAgICAgICAgICAgIHBhZ2UuJChgaW5wdXQjbm90YUF2YWxfJHtncmFkZUlkfWApLnZhbCgpXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICBncmFkZXNTdW1PZkdyYWRlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIG5hbWU6IGdyYWRlTmFtZSxcbiAgICAgICAgICAgICAgICAgIGNvZGU6IGdyYWRlQ29kZSxcbiAgICAgICAgICAgICAgICAgIG1heFZhbHVlOiBtYXhWYWx1ZSxcbiAgICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3dlaWdodGVkLWF2ZXJhZ2UnKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZ3JhZGVXZWlnaHQgPSBwYXJzZUZsb2F0KFxuICAgICAgICAgICAgICAgICAgcGFnZS4kKGBpbnB1dCNwZXNvQXZhbF8ke2dyYWRlSWR9YCkudmFsKClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIGdyYWRlc1dlaWdodGVkLnB1c2goe1xuICAgICAgICAgICAgICAgICAgbmFtZTogZ3JhZGVOYW1lLFxuICAgICAgICAgICAgICAgICAgY29kZTogZ3JhZGVDb2RlLFxuICAgICAgICAgICAgICAgICAgd2VpZ2h0OiBncmFkZVdlaWdodCxcbiAgICAgICAgICAgICAgICAgIHZhbHVlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ2FyaXRobWV0aWMtYXZlcmFnZScpIHtcbiAgICAgICAgICAgICAgICBncmFkZXNBcml0aG1ldGljLnB1c2goe1xuICAgICAgICAgICAgICAgICAgbmFtZTogZ3JhZGVOYW1lLFxuICAgICAgICAgICAgICAgICAgY29kZTogZ3JhZGVDb2RlLFxuICAgICAgICAgICAgICAgICAgdmFsdWVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgbGV0IGF2ZXJhZ2U6IG51bWJlciB8IHVuZGVmaW5lZCA9IHBhcnNlRmxvYXQoXG4gICAgICAgICAgICAgICAgdGhpcy5wYXJzZXJcbiAgICAgICAgICAgICAgICAgIC5yZW1vdmVUYWdzSHRtbCh2YWx1ZUNlbGxzLmVxKGopLmh0bWwoKSlcbiAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8sL2csICcuJylcbiAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgaWYgKGlzTmFOKGF2ZXJhZ2UpKSBhdmVyYWdlID0gdW5kZWZpbmVkO1xuXG4gICAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgICBncmFkZXNTdW1PZkdyYWRlcy5sZW5ndGggPiAwICYmXG4gICAgICAgICAgICAgICAgZ3JhZGVzV2VpZ2h0ZWQubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgICAgIGdyYWRlc0FyaXRobWV0aWMubGVuZ3RoID4gMFxuICAgICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBJbnZhbGlkIGdyYWRlIHR5cGUuJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdzdW0tb2YtZ3JhZGVzJykge1xuICAgICAgICAgICAgICAgIGdyYWRlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIG5hbWU6IGdyYWRlR3JvdXBOYW1lLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IGF2ZXJhZ2UsXG4gICAgICAgICAgICAgICAgICBncmFkZXM6IGdyYWRlc1N1bU9mR3JhZGVzLFxuICAgICAgICAgICAgICAgICAgdHlwZTogJ3N1bS1vZi1ncmFkZXMnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gJ3dlaWdodGVkLWF2ZXJhZ2UnKSB7XG4gICAgICAgICAgICAgICAgZ3JhZGVzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgbmFtZTogZ3JhZGVHcm91cE5hbWUsXG4gICAgICAgICAgICAgICAgICB2YWx1ZTogYXZlcmFnZSxcbiAgICAgICAgICAgICAgICAgIGdyYWRlczogZ3JhZGVzV2VpZ2h0ZWQsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnd2VpZ2h0ZWQtYXZlcmFnZSdcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlID09PSAnYXJpdGhtZXRpYy1hdmVyYWdlJykge1xuICAgICAgICAgICAgICAgIGdyYWRlcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgIG5hbWU6IGdyYWRlR3JvdXBOYW1lLFxuICAgICAgICAgICAgICAgICAgdmFsdWU6IGF2ZXJhZ2UsXG4gICAgICAgICAgICAgICAgICBncmFkZXM6IGdyYWRlc0FyaXRobWV0aWMsXG4gICAgICAgICAgICAgICAgICB0eXBlOiAnYXJpdGhtZXRpYy1hdmVyYWdlJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZ3JhZGVzO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAocmV0cnkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0R3JhZGVzKGZhbHNlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgYXN5bmMgZ2V0U3lsbGFidXMoKTogUHJvbWlzZTxTeWxsYWJ1cz4ge1xuICAgIGNvbnN0IHBhZ2UgPSBhd2FpdCB0aGlzLmdldENvdXJzZVN1Yk1lbnUoJ1BsYW5vIGRlIEVuc2lubycpO1xuICAgIGNvbnN0IHRhYmxlcyA9IHBhZ2UuJCgndGFibGUubGlzdGFnZW0nKS50b0FycmF5KCk7XG5cbiAgICBjb25zdCByZXNwb25zZTogU3lsbGFidXMgPSB7XG4gICAgICBzY2hlZHVsZTogW10sXG4gICAgICBldmFsdWF0aW9uczogW10sXG4gICAgICBiYXNpY1JlZmVyZW5jZXM6IFtdLFxuICAgICAgc3VwcGxlbWVudGFyeVJlZmVyZW5jZXM6IFtdXG4gICAgfTtcbiAgICBmb3IgKGNvbnN0IHRhYmxlIG9mIHRhYmxlcykge1xuICAgICAgY29uc3QgdGl0bGVFbGVtZW50ID0gcGFnZS4kKHRhYmxlKS5maW5kKCdjYXB0aW9uJyk7XG4gICAgICBjb25zdCB0aXRsZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHRpdGxlRWxlbWVudC5odG1sKCkpO1xuXG4gICAgICBjb25zdCByb3dzID0gcGFnZS4kKHRhYmxlKS5jaGlsZHJlbigndGJvZHknKS5jaGlsZHJlbigndHInKS50b0FycmF5KCk7XG4gICAgICBzd2l0Y2ggKHRpdGxlKSB7XG4gICAgICAgIGNhc2UgJ01ldG9kb2xvZ2lhIGRlIEVuc2lubyBlIEF2YWxpYcOnw6NvJzoge1xuICAgICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIGNvbnN0IHJvd0JvZHlFbGVtZW50ID0gcGFnZS4kKHJvdykuY2hpbGRyZW4oJ3RkJyk7XG4gICAgICAgICAgICBjb25zdCBib2R5ID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWxLZWVwaW5nRW1waGFzaXMoXG4gICAgICAgICAgICAgIHJvd0JvZHlFbGVtZW50Lmh0bWwoKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIGNvbnN0IHJvd0ZpZWxkRWxlbWVudCA9IHBhZ2UuJChyb3cpLmNoaWxkcmVuKCd0aCcpO1xuXG4gICAgICAgICAgICBjb25zdCByb3dGaWVsZCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHJvd0ZpZWxkRWxlbWVudC5odG1sKCkpO1xuICAgICAgICAgICAgaWYgKHJvd0ZpZWxkID09PSAnTWV0b2RvbG9naWE6Jykge1xuICAgICAgICAgICAgICByZXNwb25zZS5tZXRob2RzID0gYm9keTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICAgIHJvd0ZpZWxkID09PSAnUHJvY2VkaW1lbnRvcyBkZSBBdmFsaWHDp8OjbyBkYSBBcHJlbmRpemFnZW06J1xuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmFzc2Vzc21lbnRQcm9jZWR1cmVzID0gYm9keTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAocm93RmllbGQgPT09ICdIb3LDoXJpbyBkZSBhdGVuZGltZW50bzonKSB7XG4gICAgICAgICAgICAgIHJlc3BvbnNlLmF0dGVuZGFuY2VTY2hlZHVsZSA9IGJvZHk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBMYWJlbCBub3QgZm91bmQuJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgJ0Nyb25vZ3JhbWEgZGUgQXVsYXMnOiB7XG4gICAgICAgICAgY29uc3Qgc2NoZWR1bGUgPSBbXTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICBjb25zdCBzdGFydERhdGVFbGVtZW50ID0gcGFnZS4kKHJvdykuY2hpbGRyZW4oJ3RkJykuZXEoMCk7XG4gICAgICAgICAgICBjb25zdCBlbmREYXRlRWxlbWVudCA9IHBhZ2UuJChyb3cpLmNoaWxkcmVuKCd0ZCcpLmVxKDEpO1xuICAgICAgICAgICAgY29uc3QgYm9keUVsZW1lbnQgPSBwYWdlLiQocm93KS5jaGlsZHJlbigndGQnKS5lcSgyKTtcblxuICAgICAgICAgICAgY29uc3Qgc3RhcnREYXRlU3RyaW5nID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoXG4gICAgICAgICAgICAgIHN0YXJ0RGF0ZUVsZW1lbnQuaHRtbCgpXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBsZXQgc3RhcnREYXRlO1xuICAgICAgICAgICAgaWYgKHN0YXJ0RGF0ZVN0cmluZykge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGRhdGVzID0gdGhpcy5wYXJzZXIucGFyc2VEYXRlcyhzdGFydERhdGVTdHJpbmcsIDEpO1xuICAgICAgICAgICAgICAgIHN0YXJ0RGF0ZSA9IGRhdGVzWzBdO1xuICAgICAgICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1lbXB0eVxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHt9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnN0IGVuZERhdGVTdHJpbmcgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcbiAgICAgICAgICAgICAgZW5kRGF0ZUVsZW1lbnQuaHRtbCgpXG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBsZXQgZW5kRGF0ZTtcbiAgICAgICAgICAgIGlmIChlbmREYXRlU3RyaW5nKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0ZXMgPSB0aGlzLnBhcnNlci5wYXJzZURhdGVzKGVuZERhdGVTdHJpbmcsIDEpO1xuICAgICAgICAgICAgICAgIGVuZERhdGUgPSBkYXRlc1swXTtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZW1wdHlcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGJvZHlFbGVtZW50Lmh0bWwoKSk7XG5cbiAgICAgICAgICAgIHNjaGVkdWxlLnB1c2goe1xuICAgICAgICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgICAgICAgc3RhcnREYXRlLFxuICAgICAgICAgICAgICBlbmREYXRlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmVzcG9uc2Uuc2NoZWR1bGUgPSBzY2hlZHVsZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlICdBdmFsaWHDp8O1ZXMnOiB7XG4gICAgICAgICAgY29uc3QgZXZhbHVhdGlvbnM6IEV4YW1bXSA9IFtdO1xuICAgICAgICAgIGZvciAoY29uc3Qgcm93IG9mIHJvd3MpIHtcbiAgICAgICAgICAgIGNvbnN0IGRhdGVFbGVtZW50ID0gcGFnZS4kKHJvdykuY2hpbGRyZW4oJ3RkJykuZXEoMCk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uRWxlbWVudCA9IHBhZ2UuJChyb3cpLmNoaWxkcmVuKCd0ZCcpLmVxKDEpO1xuICAgICAgICAgICAgY29uc3QgZGF0ZVN0cmluZyA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGRhdGVFbGVtZW50Lmh0bWwoKSk7XG4gICAgICAgICAgICBsZXQgZGF0ZTtcbiAgICAgICAgICAgIGlmIChkYXRlU3RyaW5nKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgZGF0ZXMgPSB0aGlzLnBhcnNlci5wYXJzZURhdGVzKGRhdGVTdHJpbmcsIDEpO1xuICAgICAgICAgICAgICAgIGRhdGUgPSBkYXRlc1swXTtcbiAgICAgICAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tZW1wdHlcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7fVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBkZXNjcmlwdGlvblRleHQgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb25FbGVtZW50Lmh0bWwoKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgZXZhbHVhdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBkZXNjcmlwdGlvblRleHQsXG4gICAgICAgICAgICAgIGRhdGVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNwb25zZS5ldmFsdWF0aW9ucyA9IGV2YWx1YXRpb25zO1xuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSAnUmVmZXLDqm5jaWFzIELDoXNpY2FzJzpcbiAgICAgICAgY2FzZSAnUmVmZXLDqm5jaWFzIENvbXBsZW1lbnRhcmVzJzoge1xuICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZXMgPSBbXTtcbiAgICAgICAgICBmb3IgKGNvbnN0IHJvdyBvZiByb3dzKSB7XG4gICAgICAgICAgICBjb25zdCByZWZlcmVuY2VUeXBlRWxlbWVudCA9IHBhZ2UuJChyb3cpLmZpbmQoJ3RkJykuZXEoMCk7XG5cbiAgICAgICAgICAgIGNvbnN0IHJlZmVyZW5jZVR5cGUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcbiAgICAgICAgICAgICAgcmVmZXJlbmNlVHlwZUVsZW1lbnQuaHRtbCgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgY29uc3QgZGVzY3JpcHRpb25FbGVtZW50ID0gcGFnZS4kKHJvdykuY2hpbGRyZW4oJ3RkJykuZXEoMSk7XG5cbiAgICAgICAgICAgIGNvbnN0IGRlc2NyaXB0aW9uVGV4dCA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sS2VlcGluZ0VtcGhhc2lzKFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbkVsZW1lbnQuaHRtbCgpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmVmZXJlbmNlcy5wdXNoKHtcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246IGRlc2NyaXB0aW9uVGV4dCxcbiAgICAgICAgICAgICAgdHlwZTogcmVmZXJlbmNlVHlwZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aXRsZSA9PT0gJ1JlZmVyw6puY2lhcyBCw6FzaWNhcycpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLmJhc2ljUmVmZXJlbmNlcyA9IHJlZmVyZW5jZXM7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aXRsZSA9PT0gJ1JlZmVyw6puY2lhcyBDb21wbGVtZW50YXJlcycpIHtcbiAgICAgICAgICAgIHJlc3BvbnNlLnN1cHBsZW1lbnRhcnlSZWZlcmVuY2VzID0gcmVmZXJlbmNlcztcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgJ1dBUk5JTkc6RWR1Y2F0aW9uIHBsYW4gdGFibGUgdGl0bGUgbm90IHJlY29nbml6ZWQ6JyArIHRpdGxlXG4gICAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG59XG4iXX0=