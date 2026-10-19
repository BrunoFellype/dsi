"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

require("source-map-support/register");

var _sigaaMain = require("./sigaa-main");

Object.keys(_sigaaMain).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaMain[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaMain[key];
    }
  });
});

var _sigaaTypes = require("./sigaa-types");

Object.keys(_sigaaTypes).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaTypes[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaTypes[key];
    }
  });
});

var _sigaaAccountFactory = require("./account/sigaa-account-factory");

Object.keys(_sigaaAccountFactory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaAccountFactory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaAccountFactory[key];
    }
  });
});

var _sigaaAccount = require("./account/sigaa-account");

Object.keys(_sigaaAccount).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaAccount[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaAccount[key];
    }
  });
});

var _sigaaActivityFactory = require("./activity/sigaa-activity-factory");

Object.keys(_sigaaActivityFactory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaActivityFactory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaActivityFactory[key];
    }
  });
});

var _sigaaExamActivity = require("./activity/sigaa-exam-activity");

Object.keys(_sigaaExamActivity).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaExamActivity[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaExamActivity[key];
    }
  });
});

var _sigaaHomeworkActivity = require("./activity/sigaa-homework-activity");

Object.keys(_sigaaHomeworkActivity).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaHomeworkActivity[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaHomeworkActivity[key];
    }
  });
});

var _sigaaQuizActivity = require("./activity/sigaa-quiz-activity");

Object.keys(_sigaaQuizActivity).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaQuizActivity[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaQuizActivity[key];
    }
  });
});

var _sigaaHomeworkStudent = require("./courses/resources/attachments/sigaa-homework-student");

Object.keys(_sigaaHomeworkStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaHomeworkStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaHomeworkStudent[key];
    }
  });
});

var _sigaaLinkStudent = require("./courses/resources/attachments/sigaa-link-student");

Object.keys(_sigaaLinkStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaLinkStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaLinkStudent[key];
    }
  });
});

var _sigaaQuizStudent = require("./courses/resources/attachments/sigaa-quiz-student");

Object.keys(_sigaaQuizStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaQuizStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaQuizStudent[key];
    }
  });
});

var _sigaaSurveyStudent = require("./courses/resources/attachments/sigaa-survey-student");

Object.keys(_sigaaSurveyStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaSurveyStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaSurveyStudent[key];
    }
  });
});

var _sigaaVideoStudent = require("./courses/resources/attachments/sigaa-video-student");

Object.keys(_sigaaVideoStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaVideoStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaVideoStudent[key];
    }
  });
});

var _sigaaWebContentStudent = require("./courses/resources/attachments/sigaa-web-content-student");

Object.keys(_sigaaWebContentStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaWebContentStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaWebContentStudent[key];
    }
  });
});

var _sigaaBondFactory = require("./bonds/sigaa-bond-factory");

Object.keys(_sigaaBondFactory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaBondFactory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaBondFactory[key];
    }
  });
});

var _sigaaStudentBond = require("./bonds/sigaa-student-bond");

Object.keys(_sigaaStudentBond).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaStudentBond[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaStudentBond[key];
    }
  });
});

var _sigaaTeacherBond = require("./bonds/sigaa-teacher-bond");

Object.keys(_sigaaTeacherBond).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaTeacherBond[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaTeacherBond[key];
    }
  });
});

var _sigaaCourseForumStudent = require("./courses/resources/forum/sigaa-course-forum-student");

Object.keys(_sigaaCourseForumStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaCourseForumStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaCourseForumStudent[key];
    }
  });
});

var _sigaaAbsenceListStudent = require("./courses/resources/sigaa-absence-list-student");

Object.keys(_sigaaAbsenceListStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaAbsenceListStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaAbsenceListStudent[key];
    }
  });
});

var _sigaaExamStudent = require("./courses/resources/sigaa-exam-student");

Object.keys(_sigaaExamStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaExamStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaExamStudent[key];
    }
  });
});

var _sigaaGradesStudent = require("./courses/resources/sigaa-grades-student");

Object.keys(_sigaaGradesStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaGradesStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaGradesStudent[key];
    }
  });
});

var _sigaaLessonStudent = require("./courses/resources/sigaa-lesson-student");

Object.keys(_sigaaLessonStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaLessonStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaLessonStudent[key];
    }
  });
});

var _sigaaMemberListStudent = require("./courses/resources/sigaa-member-list-student");

Object.keys(_sigaaMemberListStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaMemberListStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaMemberListStudent[key];
    }
  });
});

var _sigaaNewsStudent = require("./courses/resources/sigaa-news-student");

Object.keys(_sigaaNewsStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaNewsStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaNewsStudent[key];
    }
  });
});

var _sigaaSyllabusStudent = require("./courses/resources/sigaa-syllabus-student");

Object.keys(_sigaaSyllabusStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaSyllabusStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaSyllabusStudent[key];
    }
  });
});

var _sigaaCourseResourcesFactory = require("./courses/sigaa-course-resources-factory");

Object.keys(_sigaaCourseResourcesFactory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaCourseResourcesFactory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaCourseResourcesFactory[key];
    }
  });
});

var _sigaaCourseResourcesManagerFactory = require("./courses/sigaa-course-resources-manager-factory");

Object.keys(_sigaaCourseResourcesManagerFactory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaCourseResourcesManagerFactory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaCourseResourcesManagerFactory[key];
    }
  });
});

var _sigaaCourseResourcesManager = require("./courses/sigaa-course-resources-manager");

Object.keys(_sigaaCourseResourcesManager).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaCourseResourcesManager[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaCourseResourcesManager[key];
    }
  });
});

var _sigaaCourseStudentFactory = require("./courses/sigaa-course-student-factory");

Object.keys(_sigaaCourseStudentFactory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaCourseStudentFactory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaCourseStudentFactory[key];
    }
  });
});

var _sigaaCourseStudent = require("./courses/sigaa-course-student");

Object.keys(_sigaaCourseStudent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaCourseStudent[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaCourseStudent[key];
    }
  });
});

var _sigaaLessonParserFactory = require("./courses/sigaa-lesson-parser-factory");

Object.keys(_sigaaLessonParserFactory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaLessonParserFactory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaLessonParserFactory[key];
    }
  });
});

var _sigaaLessonParser = require("./courses/sigaa-lesson-parser");

Object.keys(_sigaaLessonParser).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaLessonParser[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaLessonParser[key];
    }
  });
});

var _sigaaParser = require("./helpers/sigaa-parser");

Object.keys(_sigaaParser).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaParser[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaParser[key];
    }
  });
});

var _sigaaPromiseStack = require("./helpers/sigaa-promise-stack");

Object.keys(_sigaaPromiseStack).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaPromiseStack[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaPromiseStack[key];
    }
  });
});

var _sigaaSharedReturnDecoratorFactory = require("./helpers/sigaa-shared-return-decorator-factory");

Object.keys(_sigaaSharedReturnDecoratorFactory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaSharedReturnDecoratorFactory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaSharedReturnDecoratorFactory[key];
    }
  });
});

var _sigaaFile = require("./resources/sigaa-file");

Object.keys(_sigaaFile).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaFile[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaFile[key];
    }
  });
});

var _sigaaResourceManager = require("./resources/sigaa-resource-manager");

Object.keys(_sigaaResourceManager).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaResourceManager[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaResourceManager[key];
    }
  });
});

var _updatableResource = require("./resources/updatable-resource");

Object.keys(_updatableResource).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _updatableResource[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _updatableResource[key];
    }
  });
});

var _sigaaSearchTeacherResult = require("./search/sigaa-search-teacher-result");

Object.keys(_sigaaSearchTeacherResult).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaSearchTeacherResult[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaSearchTeacherResult[key];
    }
  });
});

var _sigaaSearchTeacher = require("./search/sigaa-search-teacher");

Object.keys(_sigaaSearchTeacher).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaSearchTeacher[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaSearchTeacher[key];
    }
  });
});

var _sigaaSearch = require("./search/sigaa-search");

Object.keys(_sigaaSearch).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaSearch[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaSearch[key];
    }
  });
});

var _sigaaLoginIfsc = require("./session/login/sigaa-login-ifsc");

Object.keys(_sigaaLoginIfsc).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaLoginIfsc[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaLoginIfsc[key];
    }
  });
});

var _sigaaLoginUfpb = require("./session/login/sigaa-login-ufpb");

Object.keys(_sigaaLoginUfpb).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaLoginUfpb[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaLoginUfpb[key];
    }
  });
});

var _sigaaLoginUnb = require("./session/login/sigaa-login-unb");

Object.keys(_sigaaLoginUnb).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaLoginUnb[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaLoginUnb[key];
    }
  });
});

var _sigaaLogin = require("./session/login/sigaa-login");

Object.keys(_sigaaLogin).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaLogin[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaLogin[key];
    }
  });
});

var _sigaaBondController = require("./session/sigaa-bond-controller");

Object.keys(_sigaaBondController).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaBondController[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaBondController[key];
    }
  });
});

var _sigaaCookiesController = require("./session/sigaa-cookies-controller");

Object.keys(_sigaaCookiesController).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaCookiesController[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaCookiesController[key];
    }
  });
});

var _sigaaHttpFactory = require("./session/sigaa-http-factory");

Object.keys(_sigaaHttpFactory).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaHttpFactory[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaHttpFactory[key];
    }
  });
});

var _sigaaHttpSession = require("./session/sigaa-http-session");

Object.keys(_sigaaHttpSession).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaHttpSession[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaHttpSession[key];
    }
  });
});

var _sigaaHttpWithBond = require("./session/sigaa-http-with-bond");

Object.keys(_sigaaHttpWithBond).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaHttpWithBond[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaHttpWithBond[key];
    }
  });
});

var _sigaaHttp = require("./session/sigaa-http");

Object.keys(_sigaaHttp).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaHttp[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaHttp[key];
    }
  });
});

var _sigaaPageCache = require("./session/sigaa-page-cache");

Object.keys(_sigaaPageCache).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaPageCache[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaPageCache[key];
    }
  });
});

var _sigaaPage = require("./session/sigaa-page");

Object.keys(_sigaaPage).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaPage[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaPage[key];
    }
  });
});

var _sigaaPageIfsc = require("./session/page/sigaa-page-ifsc");

Object.keys(_sigaaPageIfsc).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaPageIfsc[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaPageIfsc[key];
    }
  });
});

var _sigaaPageUfpb = require("./session/page/sigaa-page-ufpb");

Object.keys(_sigaaPageUfpb).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaPageUfpb[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaPageUfpb[key];
    }
  });
});

var _sigaaPageUnb = require("./session/page/sigaa-page-unb");

Object.keys(_sigaaPageUnb).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaPageUnb[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaPageUnb[key];
    }
  });
});

var _sigaaInstitutionController = require("./session/sigaa-institution-controller");

Object.keys(_sigaaInstitutionController).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaInstitutionController[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaInstitutionController[key];
    }
  });
});

var _sigaaSession = require("./session/sigaa-session");

Object.keys(_sigaaSession).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _sigaaSession[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _sigaaSession[key];
    }
  });
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9zaWdhYS1hbGwtdHlwZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFDQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFFQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCAqIGZyb20gJy4vc2lnYWEtbWFpbic7XHJcbmV4cG9ydCAqIGZyb20gJy4vc2lnYWEtdHlwZXMnO1xyXG5cclxuZXhwb3J0ICogZnJvbSAnQGFjY291bnQvc2lnYWEtYWNjb3VudC1mYWN0b3J5JztcclxuZXhwb3J0ICogZnJvbSAnQGFjY291bnQvc2lnYWEtYWNjb3VudCc7XHJcblxyXG5leHBvcnQgKiBmcm9tICdAYWN0aXZpdHkvc2lnYWEtYWN0aXZpdHktZmFjdG9yeSc7XHJcbmV4cG9ydCAqIGZyb20gJ0BhY3Rpdml0eS9zaWdhYS1leGFtLWFjdGl2aXR5JztcclxuZXhwb3J0ICogZnJvbSAnQGFjdGl2aXR5L3NpZ2FhLWhvbWV3b3JrLWFjdGl2aXR5JztcclxuZXhwb3J0ICogZnJvbSAnQGFjdGl2aXR5L3NpZ2FhLXF1aXotYWN0aXZpdHknO1xyXG5cclxuZXhwb3J0ICogZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLWhvbWV3b3JrLXN0dWRlbnQnO1xyXG5leHBvcnQgKiBmcm9tICdAYXR0YWNobWVudHMvc2lnYWEtbGluay1zdHVkZW50JztcclxuZXhwb3J0ICogZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLXF1aXotc3R1ZGVudCc7XHJcbmV4cG9ydCAqIGZyb20gJ0BhdHRhY2htZW50cy9zaWdhYS1zdXJ2ZXktc3R1ZGVudCc7XHJcbmV4cG9ydCAqIGZyb20gJ0BhdHRhY2htZW50cy9zaWdhYS12aWRlby1zdHVkZW50JztcclxuZXhwb3J0ICogZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLXdlYi1jb250ZW50LXN0dWRlbnQnO1xyXG5cclxuZXhwb3J0ICogZnJvbSAnQGJvbmRzL3NpZ2FhLWJvbmQtZmFjdG9yeSc7XHJcbmV4cG9ydCAqIGZyb20gJ0Bib25kcy9zaWdhYS1zdHVkZW50LWJvbmQnO1xyXG5leHBvcnQgKiBmcm9tICdAYm9uZHMvc2lnYWEtdGVhY2hlci1ib25kJztcclxuXHJcbmV4cG9ydCAqIGZyb20gJ0Bjb3Vyc2VSZXNvdXJjZXMvZm9ydW0vc2lnYWEtY291cnNlLWZvcnVtLXN0dWRlbnQnO1xyXG5leHBvcnQgKiBmcm9tICdAY291cnNlUmVzb3VyY2VzL3NpZ2FhLWFic2VuY2UtbGlzdC1zdHVkZW50JztcclxuZXhwb3J0ICogZnJvbSAnQGNvdXJzZVJlc291cmNlcy9zaWdhYS1leGFtLXN0dWRlbnQnO1xyXG5leHBvcnQgKiBmcm9tICdAY291cnNlUmVzb3VyY2VzL3NpZ2FhLWdyYWRlcy1zdHVkZW50JztcclxuZXhwb3J0ICogZnJvbSAnQGNvdXJzZVJlc291cmNlcy9zaWdhYS1sZXNzb24tc3R1ZGVudCc7XHJcbmV4cG9ydCAqIGZyb20gJ0Bjb3Vyc2VSZXNvdXJjZXMvc2lnYWEtbWVtYmVyLWxpc3Qtc3R1ZGVudCc7XHJcbmV4cG9ydCAqIGZyb20gJ0Bjb3Vyc2VSZXNvdXJjZXMvc2lnYWEtbmV3cy1zdHVkZW50JztcclxuZXhwb3J0ICogZnJvbSAnQGNvdXJzZVJlc291cmNlcy9zaWdhYS1zeWxsYWJ1cy1zdHVkZW50JztcclxuXHJcbmV4cG9ydCAqIGZyb20gJ0Bjb3Vyc2VzL3NpZ2FhLWNvdXJzZS1yZXNvdXJjZXMtZmFjdG9yeSc7XHJcbmV4cG9ydCAqIGZyb20gJ0Bjb3Vyc2VzL3NpZ2FhLWNvdXJzZS1yZXNvdXJjZXMtbWFuYWdlci1mYWN0b3J5JztcclxuZXhwb3J0ICogZnJvbSAnQGNvdXJzZXMvc2lnYWEtY291cnNlLXJlc291cmNlcy1tYW5hZ2VyJztcclxuZXhwb3J0ICogZnJvbSAnQGNvdXJzZXMvc2lnYWEtY291cnNlLXN0dWRlbnQtZmFjdG9yeSc7XHJcbmV4cG9ydCAqIGZyb20gJ0Bjb3Vyc2VzL3NpZ2FhLWNvdXJzZS1zdHVkZW50JztcclxuZXhwb3J0ICogZnJvbSAnQGNvdXJzZXMvc2lnYWEtY291cnNlLXN0dWRlbnQnO1xyXG5leHBvcnQgKiBmcm9tICdAY291cnNlcy9zaWdhYS1sZXNzb24tcGFyc2VyLWZhY3RvcnknO1xyXG5leHBvcnQgKiBmcm9tICdAY291cnNlcy9zaWdhYS1sZXNzb24tcGFyc2VyJztcclxuXHJcbmV4cG9ydCAqIGZyb20gJ0BoZWxwZXJzL3NpZ2FhLXBhcnNlcic7XHJcbmV4cG9ydCAqIGZyb20gJ0BoZWxwZXJzL3NpZ2FhLXByb21pc2Utc3RhY2snO1xyXG5leHBvcnQgKiBmcm9tICdAaGVscGVycy9zaWdhYS1zaGFyZWQtcmV0dXJuLWRlY29yYXRvci1mYWN0b3J5JztcclxuXHJcbmV4cG9ydCAqIGZyb20gJ0ByZXNvdXJjZXMvc2lnYWEtZmlsZSc7XHJcbmV4cG9ydCAqIGZyb20gJ0ByZXNvdXJjZXMvc2lnYWEtcmVzb3VyY2UtbWFuYWdlcic7XHJcbmV4cG9ydCAqIGZyb20gJ0ByZXNvdXJjZXMvdXBkYXRhYmxlLXJlc291cmNlJztcclxuXHJcbmV4cG9ydCAqIGZyb20gJ0BzZWFyY2gvc2lnYWEtc2VhcmNoLXRlYWNoZXItcmVzdWx0JztcclxuZXhwb3J0ICogZnJvbSAnQHNlYXJjaC9zaWdhYS1zZWFyY2gtdGVhY2hlcic7XHJcbmV4cG9ydCAqIGZyb20gJ0BzZWFyY2gvc2lnYWEtc2VhcmNoJztcclxuXHJcbmV4cG9ydCAqIGZyb20gJ0BzZXNzaW9uL2xvZ2luL3NpZ2FhLWxvZ2luLWlmc2MnO1xyXG5leHBvcnQgKiBmcm9tICdAc2Vzc2lvbi9sb2dpbi9zaWdhYS1sb2dpbi11ZnBiJztcclxuZXhwb3J0ICogZnJvbSAnQHNlc3Npb24vbG9naW4vc2lnYWEtbG9naW4tdW5iJztcclxuZXhwb3J0ICogZnJvbSAnQHNlc3Npb24vbG9naW4vc2lnYWEtbG9naW4nO1xyXG5cclxuZXhwb3J0ICogZnJvbSAnQHNlc3Npb24vc2lnYWEtYm9uZC1jb250cm9sbGVyJztcclxuXHJcbmV4cG9ydCAqIGZyb20gJ0BzZXNzaW9uL3NpZ2FhLWNvb2tpZXMtY29udHJvbGxlcic7XHJcbmV4cG9ydCAqIGZyb20gJ0BzZXNzaW9uL3NpZ2FhLWh0dHAtZmFjdG9yeSc7XHJcbmV4cG9ydCAqIGZyb20gJ0BzZXNzaW9uL3NpZ2FhLWh0dHAtc2Vzc2lvbic7XHJcbmV4cG9ydCAqIGZyb20gJ0BzZXNzaW9uL3NpZ2FhLWh0dHAtd2l0aC1ib25kJztcclxuZXhwb3J0ICogZnJvbSAnQHNlc3Npb24vc2lnYWEtaHR0cCc7XHJcblxyXG5leHBvcnQgKiBmcm9tICdAc2Vzc2lvbi9zaWdhYS1wYWdlLWNhY2hlJztcclxuZXhwb3J0ICogZnJvbSAnQHNlc3Npb24vc2lnYWEtcGFnZSc7XHJcbmV4cG9ydCAqIGZyb20gJ0BzZXNzaW9uL3BhZ2Uvc2lnYWEtcGFnZS1pZnNjJztcclxuZXhwb3J0ICogZnJvbSAnQHNlc3Npb24vcGFnZS9zaWdhYS1wYWdlLXVmcGInO1xyXG5leHBvcnQgKiBmcm9tICdAc2Vzc2lvbi9wYWdlL3NpZ2FhLXBhZ2UtdW5iJztcclxuXHJcbmV4cG9ydCAqIGZyb20gJ0BzZXNzaW9uL3NpZ2FhLWluc3RpdHV0aW9uLWNvbnRyb2xsZXInO1xyXG5cclxuZXhwb3J0ICogZnJvbSAnQHNlc3Npb24vc2lnYWEtc2Vzc2lvbic7XHJcbiJdfQ==