"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaLessonParser = void 0;

require("source-map-support/register");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * @category Internal
 */
class SigaaLessonParser {
  constructor(parser, resources) {
    this.parser = parser;
    this.resources = resources;

    _defineProperty(this, "forumsIdIndex", 0);
  }

  /**
   * Parse the page and retrieves the HTML elements that are the topics of the lesson
   * @param page
   */
  getElements(page) {
    return page.$('#conteudo .topico-aula').toArray();
  }

  parsePagedPage(page) {
    const lessonOptionElements = page.$('#formAva\\:escolherTopico option').toArray();
    const lessonIdsWithReferences = [];

    for (let index = 0; index < lessonOptionElements.length; index++) {
      const optionElement = page.$(lessonOptionElements[index]);
      const lessonId = optionElement.attr('value');
      if (!lessonId) throw new Error('SIGAA: cannot find the lesson id.');
      const titleFull = this.parser.removeTagsHtml(optionElement.html());
      const lessonDatesString = titleFull.slice(titleFull.indexOf('(') + 1, titleFull.indexOf(')'));
      const title = titleFull.slice(titleFull.indexOf(')') + 1).trim();
      const [startDate, endDate] = this.parserDate(lessonDatesString);
      lessonIdsWithReferences.push({
        title,
        index,
        id: lessonId,
        startDate,
        endDate
      });
    }

    return lessonIdsWithReferences;
  }

  parseLessonPages(pageLessonsList, pageLessonsPaged) {
    const lessonsElements = this.getElements(pageLessonsList);
    const lessonIdsWithReferences = this.parsePagedPage(pageLessonsPaged);
    this.resources.lessons.keepOnly(lessonsElements.map((lessonElement, index) => this.resources.lessons.upsert(this.parseLesson(pageLessonsList, lessonIdsWithReferences[index], lessonElement))._instanceIndentifier));
  }

  parserDate(lessonDatesString) {
    let startDateListPage, endDateListPage;

    try {
      const lessonDate = this.parser.parseDates(lessonDatesString, 2);
      startDateListPage = lessonDate[0];
      endDateListPage = lessonDate[1];
    } catch (err) {
      const lessonDate = this.parser.parseDates(lessonDatesString, 1);
      startDateListPage = lessonDate[0];
      endDateListPage = lessonDate[0];
    }

    return [startDateListPage, endDateListPage];
  }
  /**
   * Parse each lesson topic HTML element
   */


  parseLesson(page, lessonIdWithReference, lessonElement) {
    const titleElement = page.$(lessonElement).find('.titulo');
    const titleFull = this.parser.removeTagsHtml(titleElement.html());
    const lessonDatesString = titleFull.slice(titleFull.lastIndexOf('(') + 1, titleFull.lastIndexOf(')'));
    const [startDate, endDate] = this.parserDate(lessonDatesString);
    const title = titleFull.slice(0, titleFull.lastIndexOf('(')).trim();
    if (lessonIdWithReference.startDate.valueOf() !== startDate.valueOf() && lessonIdWithReference.endDate.valueOf() !== endDate.valueOf() && lessonIdWithReference.title != title) console.error(new Error('SIGAA: The result of the lesson list parser is different than expected because the title or date does not match.'));
    const lessonContentElement = page.$(lessonElement).find('.conteudotopico');
    const id = lessonIdWithReference.id;
    const lessonHTML = lessonContentElement.html();
    if (!lessonHTML) throw new Error('SIGAA: Lesson without content.');
    const lessonContent = this.parser.removeTagsHtml(lessonHTML.replace(/<div([\S\s]*?)div>/gm, ''));
    const attachments = this.parseAttachmentsFromLesson(page, lessonContentElement);
    const contentText = attachments.reduce((reducer, attachment) => {
      if (attachment.type === 'text') return `${reducer}\n${attachment.body}`;
      return reducer;
    }, lessonContent);
    const lesson = {
      title,
      contentText,
      startDate: startDate,
      id,
      instanceIndentifier: id,
      endDate: endDate,
      attachments: attachments.filter(attachment => attachment.type !== 'text')
    };
    return lesson;
  }
  /**
   * Receive each class topic and parse each attachment in them
   * @param page
   * @param lessonContentElement
   */


  parseAttachmentsFromLesson(page, lessonContentElement) {
    const lessonAttachments = [];
    const attachmentElements = lessonContentElement.find('span[id] > div.item').toArray();

    if (attachmentElements.length !== 0) {
      for (const attachmentElement of attachmentElements) {
        const iconElement = page.$(attachmentElement).find('img');
        const iconSrc = iconElement.attr('src');

        try {
          if (iconSrc === undefined) {
            const attachmentText = {
              type: 'text',
              body: this.parser.removeTagsHtml(page.$(attachmentElement).html())
            };
            lessonAttachments.push(attachmentText);
          } else if (iconSrc.includes('questionario.png')) {
            const quiz = this.parseAttachmentQuiz(page, attachmentElement);
            lessonAttachments.push(quiz);
          } else if (iconSrc.includes('video.png')) {
            const video = this.parseAttachmentVideo(page, attachmentElement);
            lessonAttachments.push(video);
          } else if (iconSrc.includes('tarefa.png')) {
            const homework = this.parseAttachmentHomework(page, attachmentElement);
            lessonAttachments.push(homework);
          } else if (iconSrc.includes('pesquisa.png')) {
            const survey = this.parseAttachmentSurvey(page, attachmentElement);
            lessonAttachments.push(survey);
          } else if (iconSrc.includes('conteudo.png')) {
            const webContents = this.parseAttachmentWebContent(page, attachmentElement);
            lessonAttachments.push(webContents);
          } else if (iconSrc.includes('forumava.png')) {
            const genericOptions = this.parseAttachmentGeneric(page, attachmentElement);
            const forumOptions = { ...genericOptions,
              instanceIndentifier: this.forumsIdIndex.toString()
            };
            this.forumsIdIndex++;
            const forum = this.resources.forums.upsert(forumOptions);
            lessonAttachments.push(forum);
          } else if (iconSrc.includes('portal_turma/site_add.png')) {
            const link = this.parseAttachmentLink(page, attachmentElement);
            lessonAttachments.push(link);
          } else {
            const file = this.parseAttachmentFile(page, attachmentElement);
            lessonAttachments.push(file);
          }
        } catch (error) {
          error.iconSrc = iconSrc;
          error.htmlAttachment = page.$(attachmentElement).html();
          throw error;
        }
      }
    }

    return lessonAttachments;
  }
  /**
   * Parse the file attached to the lesson topic
   * @param page
   * @param attachmentElement
   */


  parseAttachmentFile(page, attachmentElement) {
    const fileData = this.parseAttachmentGeneric(page, attachmentElement);
    return this.resources.files.upsert(fileData);
  }
  /**
   * Parse the web content attached to the lesson topic
   * @param page
   * @param attachmentElement
   */


  parseAttachmentWebContent(page, attachmentElement) {
    const webContentOptions = this.parseAttachmentGeneric(page, attachmentElement);
    return this.resources.webContents.upsert(webContentOptions);
  }
  /**
   * Parse a generic attachment (a link) attached to the lesson topic
   * @param page
   * @param attachmentElement
   */


  parseAttachmentGeneric(page, attachmentElement) {
    const titleElement = page.$(attachmentElement).find('span').children().first();
    const title = this.parser.removeTagsHtml(titleElement.html());
    const titleOnClick = titleElement.attr('onclick');
    if (!titleOnClick) throw new Error('SIGAA: Attachment title without onclick event.');
    const form = page.parseJSFCLJS(titleOnClick);
    const id = form.postValues.id;
    const descriptionElement = page.$(attachmentElement).find('div.descricao-item');
    const description = this.parser.removeTagsHtml(descriptionElement.html());
    return {
      title,
      form,
      id,
      instanceIndentifier: id,
      description
    };
  }
  /**
   * Parse the survey (Enquete) attached to the lesson topic
   * @param page
   * @param attachmentElement
   */


  parseAttachmentSurvey(page, attachmentElement) {
    const titleElement = page.$(attachmentElement).find('span > a');
    const title = this.parser.removeTagsHtml(titleElement.html());
    const titleOnClick = titleElement.attr('onclick');
    if (!titleOnClick) throw new Error('SIGAA: Survey title without onclick event.');
    const form = page.parseJSFCLJS(titleOnClick);
    const surveyOptions = {
      title,
      form,
      id: form.postValues.id,
      instanceIndentifier: form.postValues.id
    };
    return this.resources.survey.upsert(surveyOptions);
  }
  /**
   * Parse the homework attached to the lesson topic
   * @param page
   * @param attachmentElement
   */


  parseAttachmentHomework(page, attachmentElement) {
    const titleElement = page.$(attachmentElement).find('span > a');
    const titleOnClick = titleElement.attr('onclick');
    if (!titleOnClick) throw new Error('SIGAA: Homework title without onclick event.');
    const form = page.parseJSFCLJS(titleOnClick);
    const id = form.postValues.id;
    const title = this.parser.removeTagsHtml(titleElement.html());
    const descriptionElement = page.$(attachmentElement).find('div.descricao-item');
    const description = this.parser.removeTagsHtml(descriptionElement.html());
    const dates = this.parser.parseDates(description, 2);
    const startDate = dates[0];
    const endDate = dates[1];
    const homeworkOptions = {
      id,
      title,
      instanceIndentifier: id,
      startDate,
      endDate
    };
    return this.resources.homework.upsert(homeworkOptions);
  }
  /**
   * Parse the video attached to the lesson topic
   * @param page
   * @param attachmentElement
   */


  parseAttachmentVideo(page, attachmentElement) {
    const titleElement = page.$(attachmentElement).find('span[id] > span[id] a');
    const href = titleElement.attr('href');
    const descriptionElement = page.$(attachmentElement).find('div.descricao-item');
    const description = this.parser.removeTagsHtml(descriptionElement.html());
    let title = this.parser.removeTagsHtml(titleElement.html());
    let src;

    if (href) {
      title = title.replace(/\(Link Externo\)$/g, '');
      src = href;
    } else {
      const titleElement = page.$(attachmentElement).find('span[id] > span[id]');
      title = this.parser.removeTagsHtml(titleElement.html());
      const srcIframe = page.$(attachmentElement).find('iframe').attr('src');
      if (!srcIframe) throw new Error('SIGAA: Video iframe without url.');
      src = srcIframe;
    }

    return {
      type: 'video',
      title,
      src,
      description
    };
  }
  /**
   * Parse the external link attached to the lesson topic
   * @param page
   * @param attachmentElement
   */


  parseAttachmentLink(page, attachmentElement) {
    const type = 'link';
    const titleElement = page.$(attachmentElement).find('span[id] > a');
    const title = this.parser.removeTagsHtml(titleElement.html());
    const href = titleElement.attr('href');
    if (!href) throw new Error('SIGAA: Link attachment does not have href.');
    const descriptionElement = page.$(attachmentElement).find('div.descricao-item');
    const description = this.parser.removeTagsHtml(descriptionElement.html());
    return {
      type,
      title,
      href,
      description
    };
  }
  /**
   * Parse the quiz (questionário) attached to the lesson topic
   * @param page
   * @param attachmentElement
   */


  parseAttachmentQuiz(page, attachmentElement) {
    const titleElement = page.$(attachmentElement).find('span > a');
    const title = this.parser.removeTagsHtml(titleElement.html());
    const onClick = titleElement.attr('onclick');
    if (!onClick) throw new Error('SIGAA: Quiz attachment without onclick event.');
    const form = page.parseJSFCLJS(onClick);
    const id = form.postValues.id;
    const descriptionElement = page.$(attachmentElement).find('div.descricao-item');
    const description = this.parser.removeTagsHtml(descriptionElement.html());
    const dates = this.parser.parseDates(description, 2);
    const startDate = dates[0];
    const endDate = dates[1];
    const quizOptions = {
      title,
      id,
      instanceIndentifier: id,
      startDate,
      endDate
    };
    return this.resources.quizzes.upsert(quizOptions);
  }

}

exports.SigaaLessonParser = SigaaLessonParser;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3Vyc2VzL3NpZ2FhLWxlc3Nvbi1wYXJzZXIudHMiXSwibmFtZXMiOlsiU2lnYWFMZXNzb25QYXJzZXIiLCJjb25zdHJ1Y3RvciIsInBhcnNlciIsInJlc291cmNlcyIsImdldEVsZW1lbnRzIiwicGFnZSIsIiQiLCJ0b0FycmF5IiwicGFyc2VQYWdlZFBhZ2UiLCJsZXNzb25PcHRpb25FbGVtZW50cyIsImxlc3Nvbklkc1dpdGhSZWZlcmVuY2VzIiwiaW5kZXgiLCJsZW5ndGgiLCJvcHRpb25FbGVtZW50IiwibGVzc29uSWQiLCJhdHRyIiwiRXJyb3IiLCJ0aXRsZUZ1bGwiLCJyZW1vdmVUYWdzSHRtbCIsImh0bWwiLCJsZXNzb25EYXRlc1N0cmluZyIsInNsaWNlIiwiaW5kZXhPZiIsInRpdGxlIiwidHJpbSIsInN0YXJ0RGF0ZSIsImVuZERhdGUiLCJwYXJzZXJEYXRlIiwicHVzaCIsImlkIiwicGFyc2VMZXNzb25QYWdlcyIsInBhZ2VMZXNzb25zTGlzdCIsInBhZ2VMZXNzb25zUGFnZWQiLCJsZXNzb25zRWxlbWVudHMiLCJsZXNzb25zIiwia2VlcE9ubHkiLCJtYXAiLCJsZXNzb25FbGVtZW50IiwidXBzZXJ0IiwicGFyc2VMZXNzb24iLCJfaW5zdGFuY2VJbmRlbnRpZmllciIsInN0YXJ0RGF0ZUxpc3RQYWdlIiwiZW5kRGF0ZUxpc3RQYWdlIiwibGVzc29uRGF0ZSIsInBhcnNlRGF0ZXMiLCJlcnIiLCJsZXNzb25JZFdpdGhSZWZlcmVuY2UiLCJ0aXRsZUVsZW1lbnQiLCJmaW5kIiwibGFzdEluZGV4T2YiLCJ2YWx1ZU9mIiwiY29uc29sZSIsImVycm9yIiwibGVzc29uQ29udGVudEVsZW1lbnQiLCJsZXNzb25IVE1MIiwibGVzc29uQ29udGVudCIsInJlcGxhY2UiLCJhdHRhY2htZW50cyIsInBhcnNlQXR0YWNobWVudHNGcm9tTGVzc29uIiwiY29udGVudFRleHQiLCJyZWR1Y2UiLCJyZWR1Y2VyIiwiYXR0YWNobWVudCIsInR5cGUiLCJib2R5IiwibGVzc29uIiwiaW5zdGFuY2VJbmRlbnRpZmllciIsImZpbHRlciIsImxlc3NvbkF0dGFjaG1lbnRzIiwiYXR0YWNobWVudEVsZW1lbnRzIiwiYXR0YWNobWVudEVsZW1lbnQiLCJpY29uRWxlbWVudCIsImljb25TcmMiLCJ1bmRlZmluZWQiLCJhdHRhY2htZW50VGV4dCIsImluY2x1ZGVzIiwicXVpeiIsInBhcnNlQXR0YWNobWVudFF1aXoiLCJ2aWRlbyIsInBhcnNlQXR0YWNobWVudFZpZGVvIiwiaG9tZXdvcmsiLCJwYXJzZUF0dGFjaG1lbnRIb21ld29yayIsInN1cnZleSIsInBhcnNlQXR0YWNobWVudFN1cnZleSIsIndlYkNvbnRlbnRzIiwicGFyc2VBdHRhY2htZW50V2ViQ29udGVudCIsImdlbmVyaWNPcHRpb25zIiwicGFyc2VBdHRhY2htZW50R2VuZXJpYyIsImZvcnVtT3B0aW9ucyIsImZvcnVtc0lkSW5kZXgiLCJ0b1N0cmluZyIsImZvcnVtIiwiZm9ydW1zIiwibGluayIsInBhcnNlQXR0YWNobWVudExpbmsiLCJmaWxlIiwicGFyc2VBdHRhY2htZW50RmlsZSIsImh0bWxBdHRhY2htZW50IiwiZmlsZURhdGEiLCJmaWxlcyIsIndlYkNvbnRlbnRPcHRpb25zIiwiY2hpbGRyZW4iLCJmaXJzdCIsInRpdGxlT25DbGljayIsImZvcm0iLCJwYXJzZUpTRkNMSlMiLCJwb3N0VmFsdWVzIiwiZGVzY3JpcHRpb25FbGVtZW50IiwiZGVzY3JpcHRpb24iLCJzdXJ2ZXlPcHRpb25zIiwiZGF0ZXMiLCJob21ld29ya09wdGlvbnMiLCJocmVmIiwic3JjIiwic3JjSWZyYW1lIiwib25DbGljayIsInF1aXpPcHRpb25zIiwicXVpenplcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFpREE7QUFDQTtBQUNBO0FBQ08sTUFBTUEsaUJBQU4sQ0FBZ0Q7QUFDckRDLEVBQUFBLFdBQVcsQ0FDREMsTUFEQyxFQUVEQyxTQUZDLEVBR1Q7QUFBQSxTQUZRRCxNQUVSLEdBRlFB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LENBQXVCZ0UsV0FBdkIsRUFBb0MsQ0FBcEMsQ0FBZDtBQUNBLFVBQU1uRixTQUFTLEdBQUdxRixLQUFLLENBQUMsQ0FBRCxDQUF2QjtBQUNBLFVBQU1wRixPQUFPLEdBQUdvRixLQUFLLENBQUMsQ0FBRCxDQUFyQjtBQUVBLFVBQU1NLFdBQVcsR0FBRztBQUNsQjdGLE1BQUFBLEtBRGtCO0FBRWxCTSxNQUFBQSxFQUZrQjtBQUdsQnFDLE1BQUFBLG1CQUFtQixFQUFFckMsRUFISDtBQUlsQkosTUFBQUEsU0FKa0I7QUFLbEJDLE1BQUFBO0FBTGtCLEtBQXBCO0FBT0EsV0FBTyxLQUFLdkIsU0FBTCxDQUFla0gsT0FBZixDQUF1Qi9FLE1BQXZCLENBQThCOEUsV0FBOUIsQ0FBUDtBQUNEOztBQXpib0QiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQYWdlLCBTaWdhYUZvcm0gfSBmcm9tICdAc2Vzc2lvbi9zaWdhYS1wYWdlJztcclxuaW1wb3J0IHsgTGlua0F0dGFjaG1lbnQgfSBmcm9tICdAYXR0YWNobWVudHMvc2lnYWEtbGluay1zdHVkZW50JztcclxuaW1wb3J0IHsgVmlkZW9BdHRhY2htZW50IH0gZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLXZpZGVvLXN0dWRlbnQnO1xyXG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tICdAaGVscGVycy9zaWdhYS1wYXJzZXInO1xyXG5pbXBvcnQgeyBBdHRhY2htZW50LCBMZXNzb25EYXRhIH0gZnJvbSAnQGNvdXJzZVJlc291cmNlcy9zaWdhYS1sZXNzb24tc3R1ZGVudCc7XHJcbmltcG9ydCB7IFF1aXogfSBmcm9tICdAYXR0YWNobWVudHMvc2lnYWEtcXVpei1zdHVkZW50JztcclxuaW1wb3J0IHsgU3VydmV5IH0gZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLXN1cnZleS1zdHVkZW50JztcclxuaW1wb3J0IHsgRm9ydW1EYXRhIH0gZnJvbSAnQGNvdXJzZVJlc291cmNlcy9mb3J1bS9zaWdhYS1jb3Vyc2UtZm9ydW0tc3R1ZGVudCc7XHJcbmltcG9ydCB7IEhvbWV3b3JrIH0gZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLWhvbWV3b3JrLXN0dWRlbnQnO1xyXG5cclxuaW1wb3J0IHsgQ291cnNlUmVzb3VyY2VzTWFuYWdlciB9IGZyb20gJ0Bjb3Vyc2VzL3NpZ2FhLWNvdXJzZS1yZXNvdXJjZXMtbWFuYWdlcic7XHJcbmltcG9ydCB7IFVwZGF0YWJsZVJlc291cmNlRGF0YSB9IGZyb20gJ0ByZXNvdXJjZXMvc2lnYWEtcmVzb3VyY2UtbWFuYWdlcic7XHJcblxyXG4vKipcclxuICogQGNhdGVnb3J5IEludGVybmFsXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIEdlbmVyaWNBdHRhY2htZW50RGF0YSBleHRlbmRzIFVwZGF0YWJsZVJlc291cmNlRGF0YSB7XHJcbiAgdGl0bGU6IHN0cmluZztcclxuICBkZXNjcmlwdGlvbjogc3RyaW5nO1xyXG4gIGZvcm06IFNpZ2FhRm9ybTtcclxuICBpZDogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICogQGNhdGVnb3J5IEludGVybmFsXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIFRleHRBdHRhY2htZW50IHtcclxuICB0eXBlOiAndGV4dCc7XHJcbiAgYm9keTogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICogQGNhdGVnb3J5IEludGVybmFsXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIExlc3NvbklkV2l0aFJlZmVyZW5jZSB7XHJcbiAgdGl0bGU6IHN0cmluZztcclxuICBpZDogc3RyaW5nO1xyXG4gIHN0YXJ0RGF0ZTogRGF0ZTtcclxuICBpbmRleDogbnVtYmVyO1xyXG4gIGVuZERhdGU6IERhdGU7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgTGVzc29uUGFyc2VyIHtcclxuICBwYXJzZUxlc3NvblBhZ2VzKHBhZ2VMZXNzb25zTGlzdDogUGFnZSwgcGFnZUxlc3NvbnNQYWdlZDogUGFnZSk6IHZvaWQ7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBjbGFzcyBTaWdhYUxlc3NvblBhcnNlciBpbXBsZW1lbnRzIExlc3NvblBhcnNlciB7XHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHBhcnNlcjogUGFyc2VyLFxyXG4gICAgcHJpdmF0ZSByZXNvdXJjZXM6IENvdXJzZVJlc291cmNlc01hbmFnZXJcclxuICApIHt9XHJcblxyXG4gIHByaXZhdGUgZm9ydW1zSWRJbmRleCA9IDA7XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlIHRoZSBwYWdlIGFuZCByZXRyaWV2ZXMgdGhlIEhUTUwgZWxlbWVudHMgdGhhdCBhcmUgdGhlIHRvcGljcyBvZiB0aGUgbGVzc29uXHJcbiAgICogQHBhcmFtIHBhZ2VcclxuICAgKi9cclxuICBwcml2YXRlIGdldEVsZW1lbnRzKHBhZ2U6IFBhZ2UpOiBjaGVlcmlvLkVsZW1lbnRbXSB7XHJcbiAgICByZXR1cm4gcGFnZS4kKCcjY29udGV1ZG8gLnRvcGljby1hdWxhJykudG9BcnJheSgpO1xyXG4gIH1cclxuXHJcbiAgcGFyc2VQYWdlZFBhZ2UocGFnZTogUGFnZSk6IExlc3NvbklkV2l0aFJlZmVyZW5jZVtdIHtcclxuICAgIGNvbnN0IGxlc3Nvbk9wdGlvbkVsZW1lbnRzID0gcGFnZVxyXG4gICAgICAuJCgnI2Zvcm1BdmFcXFxcOmVzY29saGVyVG9waWNvIG9wdGlvbicpXHJcbiAgICAgIC50b0FycmF5KCk7XHJcblxyXG4gICAgY29uc3QgbGVzc29uSWRzV2l0aFJlZmVyZW5jZXM6IExlc3NvbklkV2l0aFJlZmVyZW5jZVtdID0gW107XHJcblxyXG4gICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxlc3Nvbk9wdGlvbkVsZW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xyXG4gICAgICBjb25zdCBvcHRpb25FbGVtZW50ID0gcGFnZS4kKGxlc3Nvbk9wdGlvbkVsZW1lbnRzW2luZGV4XSk7XHJcbiAgICAgIGNvbnN0IGxlc3NvbklkID0gb3B0aW9uRWxlbWVudC5hdHRyKCd2YWx1ZScpO1xyXG4gICAgICBpZiAoIWxlc3NvbklkKSB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBjYW5ub3QgZmluZCB0aGUgbGVzc29uIGlkLicpO1xyXG5cclxuICAgICAgY29uc3QgdGl0bGVGdWxsID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwob3B0aW9uRWxlbWVudC5odG1sKCkpO1xyXG5cclxuICAgICAgY29uc3QgbGVzc29uRGF0ZXNTdHJpbmcgPSB0aXRsZUZ1bGwuc2xpY2UoXHJcbiAgICAgICAgdGl0bGVGdWxsLmluZGV4T2YoJygnKSArIDEsXHJcbiAgICAgICAgdGl0bGVGdWxsLmluZGV4T2YoJyknKVxyXG4gICAgICApO1xyXG4gICAgICBjb25zdCB0aXRsZSA9IHRpdGxlRnVsbC5zbGljZSh0aXRsZUZ1bGwuaW5kZXhPZignKScpICsgMSkudHJpbSgpO1xyXG5cclxuICAgICAgY29uc3QgW3N0YXJ0RGF0ZSwgZW5kRGF0ZV0gPSB0aGlzLnBhcnNlckRhdGUobGVzc29uRGF0ZXNTdHJpbmcpO1xyXG4gICAgICBsZXNzb25JZHNXaXRoUmVmZXJlbmNlcy5wdXNoKHtcclxuICAgICAgICB0aXRsZSxcclxuICAgICAgICBpbmRleCxcclxuICAgICAgICBpZDogbGVzc29uSWQsXHJcbiAgICAgICAgc3RhcnREYXRlLFxyXG4gICAgICAgIGVuZERhdGVcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gbGVzc29uSWRzV2l0aFJlZmVyZW5jZXM7XHJcbiAgfVxyXG5cclxuICBwYXJzZUxlc3NvblBhZ2VzKHBhZ2VMZXNzb25zTGlzdDogUGFnZSwgcGFnZUxlc3NvbnNQYWdlZDogUGFnZSk6IHZvaWQge1xyXG4gICAgY29uc3QgbGVzc29uc0VsZW1lbnRzID0gdGhpcy5nZXRFbGVtZW50cyhwYWdlTGVzc29uc0xpc3QpO1xyXG5cclxuICAgIGNvbnN0IGxlc3Nvbklkc1dpdGhSZWZlcmVuY2VzID0gdGhpcy5wYXJzZVBhZ2VkUGFnZShwYWdlTGVzc29uc1BhZ2VkKTtcclxuICAgIHRoaXMucmVzb3VyY2VzLmxlc3NvbnMua2VlcE9ubHkoXHJcbiAgICAgIGxlc3NvbnNFbGVtZW50cy5tYXAoXHJcbiAgICAgICAgKGxlc3NvbkVsZW1lbnQsIGluZGV4KSA9PlxyXG4gICAgICAgICAgdGhpcy5yZXNvdXJjZXMubGVzc29ucy51cHNlcnQoXHJcbiAgICAgICAgICAgIHRoaXMucGFyc2VMZXNzb24oXHJcbiAgICAgICAgICAgICAgcGFnZUxlc3NvbnNMaXN0LFxyXG4gICAgICAgICAgICAgIGxlc3Nvbklkc1dpdGhSZWZlcmVuY2VzW2luZGV4XSxcclxuICAgICAgICAgICAgICBsZXNzb25FbGVtZW50XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICkuX2luc3RhbmNlSW5kZW50aWZpZXJcclxuICAgICAgKVxyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIHByaXZhdGUgcGFyc2VyRGF0ZShsZXNzb25EYXRlc1N0cmluZzogc3RyaW5nKTogW0RhdGUsIERhdGVdIHtcclxuICAgIGxldCBzdGFydERhdGVMaXN0UGFnZSwgZW5kRGF0ZUxpc3RQYWdlO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgbGVzc29uRGF0ZSA9IHRoaXMucGFyc2VyLnBhcnNlRGF0ZXMobGVzc29uRGF0ZXNTdHJpbmcsIDIpO1xyXG4gICAgICBzdGFydERhdGVMaXN0UGFnZSA9IGxlc3NvbkRhdGVbMF07XHJcbiAgICAgIGVuZERhdGVMaXN0UGFnZSA9IGxlc3NvbkRhdGVbMV07XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgY29uc3QgbGVzc29uRGF0ZSA9IHRoaXMucGFyc2VyLnBhcnNlRGF0ZXMobGVzc29uRGF0ZXNTdHJpbmcsIDEpO1xyXG4gICAgICBzdGFydERhdGVMaXN0UGFnZSA9IGxlc3NvbkRhdGVbMF07XHJcbiAgICAgIGVuZERhdGVMaXN0UGFnZSA9IGxlc3NvbkRhdGVbMF07XHJcbiAgICB9XHJcbiAgICByZXR1cm4gW3N0YXJ0RGF0ZUxpc3RQYWdlLCBlbmREYXRlTGlzdFBhZ2VdO1xyXG4gIH1cclxuICAvKipcclxuICAgKiBQYXJzZSBlYWNoIGxlc3NvbiB0b3BpYyBIVE1MIGVsZW1lbnRcclxuICAgKi9cclxuICBwcml2YXRlIHBhcnNlTGVzc29uKFxyXG4gICAgcGFnZTogUGFnZSxcclxuICAgIGxlc3NvbklkV2l0aFJlZmVyZW5jZTogTGVzc29uSWRXaXRoUmVmZXJlbmNlLFxyXG4gICAgbGVzc29uRWxlbWVudDogY2hlZXJpby5FbGVtZW50XHJcbiAgKTogTGVzc29uRGF0YSB7XHJcbiAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBwYWdlLiQobGVzc29uRWxlbWVudCkuZmluZCgnLnRpdHVsbycpO1xyXG4gICAgY29uc3QgdGl0bGVGdWxsID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwodGl0bGVFbGVtZW50Lmh0bWwoKSk7XHJcblxyXG4gICAgY29uc3QgbGVzc29uRGF0ZXNTdHJpbmcgPSB0aXRsZUZ1bGwuc2xpY2UoXHJcbiAgICAgIHRpdGxlRnVsbC5sYXN0SW5kZXhPZignKCcpICsgMSxcclxuICAgICAgdGl0bGVGdWxsLmxhc3RJbmRleE9mKCcpJylcclxuICAgICk7XHJcblxyXG4gICAgY29uc3QgW3N0YXJ0RGF0ZSwgZW5kRGF0ZV0gPSB0aGlzLnBhcnNlckRhdGUobGVzc29uRGF0ZXNTdHJpbmcpO1xyXG5cclxuICAgIGNvbnN0IHRpdGxlID0gdGl0bGVGdWxsLnNsaWNlKDAsIHRpdGxlRnVsbC5sYXN0SW5kZXhPZignKCcpKS50cmltKCk7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBsZXNzb25JZFdpdGhSZWZlcmVuY2Uuc3RhcnREYXRlLnZhbHVlT2YoKSAhPT0gc3RhcnREYXRlLnZhbHVlT2YoKSAmJlxyXG4gICAgICBsZXNzb25JZFdpdGhSZWZlcmVuY2UuZW5kRGF0ZS52YWx1ZU9mKCkgIT09IGVuZERhdGUudmFsdWVPZigpICYmXHJcbiAgICAgIGxlc3NvbklkV2l0aFJlZmVyZW5jZS50aXRsZSAhPSB0aXRsZVxyXG4gICAgKVxyXG4gICAgICBjb25zb2xlLmVycm9yKFxyXG4gICAgICAgIG5ldyBFcnJvcihcclxuICAgICAgICAgICdTSUdBQTogVGhlIHJlc3VsdCBvZiB0aGUgbGVzc29uIGxpc3QgcGFyc2VyIGlzIGRpZmZlcmVudCB0aGFuIGV4cGVjdGVkIGJlY2F1c2UgdGhlIHRpdGxlIG9yIGRhdGUgZG9lcyBub3QgbWF0Y2guJ1xyXG4gICAgICAgIClcclxuICAgICAgKTtcclxuXHJcbiAgICBjb25zdCBsZXNzb25Db250ZW50RWxlbWVudCA9IHBhZ2UuJChsZXNzb25FbGVtZW50KS5maW5kKCcuY29udGV1ZG90b3BpY28nKTtcclxuXHJcbiAgICBjb25zdCBpZCA9IGxlc3NvbklkV2l0aFJlZmVyZW5jZS5pZDtcclxuXHJcbiAgICBjb25zdCBsZXNzb25IVE1MID0gbGVzc29uQ29udGVudEVsZW1lbnQuaHRtbCgpO1xyXG4gICAgaWYgKCFsZXNzb25IVE1MKSB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBMZXNzb24gd2l0aG91dCBjb250ZW50LicpO1xyXG5cclxuICAgIGNvbnN0IGxlc3NvbkNvbnRlbnQgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChcclxuICAgICAgbGVzc29uSFRNTC5yZXBsYWNlKC88ZGl2KFtcXFNcXHNdKj8pZGl2Pi9nbSwgJycpXHJcbiAgICApO1xyXG5cclxuICAgIGNvbnN0IGF0dGFjaG1lbnRzID0gdGhpcy5wYXJzZUF0dGFjaG1lbnRzRnJvbUxlc3NvbihcclxuICAgICAgcGFnZSxcclxuICAgICAgbGVzc29uQ29udGVudEVsZW1lbnRcclxuICAgICk7XHJcbiAgICBjb25zdCBjb250ZW50VGV4dCA9IGF0dGFjaG1lbnRzLnJlZHVjZSgocmVkdWNlciwgYXR0YWNobWVudCkgPT4ge1xyXG4gICAgICBpZiAoYXR0YWNobWVudC50eXBlID09PSAndGV4dCcpIHJldHVybiBgJHtyZWR1Y2VyfVxcbiR7YXR0YWNobWVudC5ib2R5fWA7XHJcbiAgICAgIHJldHVybiByZWR1Y2VyO1xyXG4gICAgfSwgbGVzc29uQ29udGVudCk7XHJcblxyXG4gICAgY29uc3QgbGVzc29uOiBMZXNzb25EYXRhID0ge1xyXG4gICAgICB0aXRsZSxcclxuICAgICAgY29udGVudFRleHQsXHJcbiAgICAgIHN0YXJ0RGF0ZTogc3RhcnREYXRlLFxyXG4gICAgICBpZCxcclxuICAgICAgaW5zdGFuY2VJbmRlbnRpZmllcjogaWQsXHJcbiAgICAgIGVuZERhdGU6IGVuZERhdGUsXHJcbiAgICAgIGF0dGFjaG1lbnRzOiBhdHRhY2htZW50cy5maWx0ZXIoXHJcbiAgICAgICAgKGF0dGFjaG1lbnQpID0+IGF0dGFjaG1lbnQudHlwZSAhPT0gJ3RleHQnXHJcbiAgICAgICkgYXMgQXR0YWNobWVudFtdXHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBsZXNzb247XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBSZWNlaXZlIGVhY2ggY2xhc3MgdG9waWMgYW5kIHBhcnNlIGVhY2ggYXR0YWNobWVudCBpbiB0aGVtXHJcbiAgICogQHBhcmFtIHBhZ2VcclxuICAgKiBAcGFyYW0gbGVzc29uQ29udGVudEVsZW1lbnRcclxuICAgKi9cclxuICBwcml2YXRlIHBhcnNlQXR0YWNobWVudHNGcm9tTGVzc29uKFxyXG4gICAgcGFnZTogUGFnZSxcclxuICAgIGxlc3NvbkNvbnRlbnRFbGVtZW50OiBjaGVlcmlvLkNoZWVyaW9cclxuICApOiAoQXR0YWNobWVudCB8IFRleHRBdHRhY2htZW50KVtdIHtcclxuICAgIGNvbnN0IGxlc3NvbkF0dGFjaG1lbnRzOiAoQXR0YWNobWVudCB8IFRleHRBdHRhY2htZW50KVtdID0gW107XHJcbiAgICBjb25zdCBhdHRhY2htZW50RWxlbWVudHMgPSBsZXNzb25Db250ZW50RWxlbWVudFxyXG4gICAgICAuZmluZCgnc3BhbltpZF0gPiBkaXYuaXRlbScpXHJcbiAgICAgIC50b0FycmF5KCk7XHJcbiAgICBpZiAoYXR0YWNobWVudEVsZW1lbnRzLmxlbmd0aCAhPT0gMCkge1xyXG4gICAgICBmb3IgKGNvbnN0IGF0dGFjaG1lbnRFbGVtZW50IG9mIGF0dGFjaG1lbnRFbGVtZW50cykge1xyXG4gICAgICAgIGNvbnN0IGljb25FbGVtZW50ID0gcGFnZS4kKGF0dGFjaG1lbnRFbGVtZW50KS5maW5kKCdpbWcnKTtcclxuICAgICAgICBjb25zdCBpY29uU3JjID0gaWNvbkVsZW1lbnQuYXR0cignc3JjJyk7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIGlmIChpY29uU3JjID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY29uc3QgYXR0YWNobWVudFRleHQ6IFRleHRBdHRhY2htZW50ID0ge1xyXG4gICAgICAgICAgICAgIHR5cGU6ICd0ZXh0JyxcclxuICAgICAgICAgICAgICBib2R5OiB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChwYWdlLiQoYXR0YWNobWVudEVsZW1lbnQpLmh0bWwoKSlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbGVzc29uQXR0YWNobWVudHMucHVzaChhdHRhY2htZW50VGV4dCk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGljb25TcmMuaW5jbHVkZXMoJ3F1ZXN0aW9uYXJpby5wbmcnKSkge1xyXG4gICAgICAgICAgICBjb25zdCBxdWl6ID0gdGhpcy5wYXJzZUF0dGFjaG1lbnRRdWl6KHBhZ2UsIGF0dGFjaG1lbnRFbGVtZW50KTtcclxuICAgICAgICAgICAgbGVzc29uQXR0YWNobWVudHMucHVzaChxdWl6KTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoaWNvblNyYy5pbmNsdWRlcygndmlkZW8ucG5nJykpIHtcclxuICAgICAgICAgICAgY29uc3QgdmlkZW8gPSB0aGlzLnBhcnNlQXR0YWNobWVudFZpZGVvKHBhZ2UsIGF0dGFjaG1lbnRFbGVtZW50KTtcclxuICAgICAgICAgICAgbGVzc29uQXR0YWNobWVudHMucHVzaCh2aWRlbyk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGljb25TcmMuaW5jbHVkZXMoJ3RhcmVmYS5wbmcnKSkge1xyXG4gICAgICAgICAgICBjb25zdCBob21ld29yayA9IHRoaXMucGFyc2VBdHRhY2htZW50SG9tZXdvcmsoXHJcbiAgICAgICAgICAgICAgcGFnZSxcclxuICAgICAgICAgICAgICBhdHRhY2htZW50RWxlbWVudFxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBsZXNzb25BdHRhY2htZW50cy5wdXNoKGhvbWV3b3JrKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoaWNvblNyYy5pbmNsdWRlcygncGVzcXVpc2EucG5nJykpIHtcclxuICAgICAgICAgICAgY29uc3Qgc3VydmV5ID0gdGhpcy5wYXJzZUF0dGFjaG1lbnRTdXJ2ZXkocGFnZSwgYXR0YWNobWVudEVsZW1lbnQpO1xyXG4gICAgICAgICAgICBsZXNzb25BdHRhY2htZW50cy5wdXNoKHN1cnZleSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGljb25TcmMuaW5jbHVkZXMoJ2NvbnRldWRvLnBuZycpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHdlYkNvbnRlbnRzID0gdGhpcy5wYXJzZUF0dGFjaG1lbnRXZWJDb250ZW50KFxyXG4gICAgICAgICAgICAgIHBhZ2UsXHJcbiAgICAgICAgICAgICAgYXR0YWNobWVudEVsZW1lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgbGVzc29uQXR0YWNobWVudHMucHVzaCh3ZWJDb250ZW50cyk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGljb25TcmMuaW5jbHVkZXMoJ2ZvcnVtYXZhLnBuZycpKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGdlbmVyaWNPcHRpb25zID0gdGhpcy5wYXJzZUF0dGFjaG1lbnRHZW5lcmljKFxyXG4gICAgICAgICAgICAgIHBhZ2UsXHJcbiAgICAgICAgICAgICAgYXR0YWNobWVudEVsZW1lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY29uc3QgZm9ydW1PcHRpb25zOiBGb3J1bURhdGEgPSB7XHJcbiAgICAgICAgICAgICAgLi4uZ2VuZXJpY09wdGlvbnMsXHJcbiAgICAgICAgICAgICAgaW5zdGFuY2VJbmRlbnRpZmllcjogdGhpcy5mb3J1bXNJZEluZGV4LnRvU3RyaW5nKClcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZm9ydW1zSWRJbmRleCsrO1xyXG4gICAgICAgICAgICBjb25zdCBmb3J1bSA9IHRoaXMucmVzb3VyY2VzLmZvcnVtcy51cHNlcnQoZm9ydW1PcHRpb25zKTtcclxuICAgICAgICAgICAgbGVzc29uQXR0YWNobWVudHMucHVzaChmb3J1bSk7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGljb25TcmMuaW5jbHVkZXMoJ3BvcnRhbF90dXJtYS9zaXRlX2FkZC5wbmcnKSkge1xyXG4gICAgICAgICAgICBjb25zdCBsaW5rID0gdGhpcy5wYXJzZUF0dGFjaG1lbnRMaW5rKHBhZ2UsIGF0dGFjaG1lbnRFbGVtZW50KTtcclxuICAgICAgICAgICAgbGVzc29uQXR0YWNobWVudHMucHVzaChsaW5rKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGZpbGUgPSB0aGlzLnBhcnNlQXR0YWNobWVudEZpbGUocGFnZSwgYXR0YWNobWVudEVsZW1lbnQpO1xyXG4gICAgICAgICAgICBsZXNzb25BdHRhY2htZW50cy5wdXNoKGZpbGUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICBlcnJvci5pY29uU3JjID0gaWNvblNyYztcclxuICAgICAgICAgIGVycm9yLmh0bWxBdHRhY2htZW50ID0gcGFnZS4kKGF0dGFjaG1lbnRFbGVtZW50KS5odG1sKCk7XHJcbiAgICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHJldHVybiBsZXNzb25BdHRhY2htZW50cztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlIHRoZSBmaWxlIGF0dGFjaGVkIHRvIHRoZSBsZXNzb24gdG9waWNcclxuICAgKiBAcGFyYW0gcGFnZVxyXG4gICAqIEBwYXJhbSBhdHRhY2htZW50RWxlbWVudFxyXG4gICAqL1xyXG4gIHByaXZhdGUgcGFyc2VBdHRhY2htZW50RmlsZShwYWdlOiBQYWdlLCBhdHRhY2htZW50RWxlbWVudDogY2hlZXJpby5FbGVtZW50KSB7XHJcbiAgICBjb25zdCBmaWxlRGF0YSA9IHRoaXMucGFyc2VBdHRhY2htZW50R2VuZXJpYyhwYWdlLCBhdHRhY2htZW50RWxlbWVudCk7XHJcbiAgICByZXR1cm4gdGhpcy5yZXNvdXJjZXMuZmlsZXMudXBzZXJ0KGZpbGVEYXRhKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlIHRoZSB3ZWIgY29udGVudCBhdHRhY2hlZCB0byB0aGUgbGVzc29uIHRvcGljXHJcbiAgICogQHBhcmFtIHBhZ2VcclxuICAgKiBAcGFyYW0gYXR0YWNobWVudEVsZW1lbnRcclxuICAgKi9cclxuICBwcml2YXRlIHBhcnNlQXR0YWNobWVudFdlYkNvbnRlbnQoXHJcbiAgICBwYWdlOiBQYWdlLFxyXG4gICAgYXR0YWNobWVudEVsZW1lbnQ6IGNoZWVyaW8uRWxlbWVudFxyXG4gICkge1xyXG4gICAgY29uc3Qgd2ViQ29udGVudE9wdGlvbnMgPSB0aGlzLnBhcnNlQXR0YWNobWVudEdlbmVyaWMoXHJcbiAgICAgIHBhZ2UsXHJcbiAgICAgIGF0dGFjaG1lbnRFbGVtZW50XHJcbiAgICApO1xyXG4gICAgcmV0dXJuIHRoaXMucmVzb3VyY2VzLndlYkNvbnRlbnRzLnVwc2VydCh3ZWJDb250ZW50T3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQYXJzZSBhIGdlbmVyaWMgYXR0YWNobWVudCAoYSBsaW5rKSBhdHRhY2hlZCB0byB0aGUgbGVzc29uIHRvcGljXHJcbiAgICogQHBhcmFtIHBhZ2VcclxuICAgKiBAcGFyYW0gYXR0YWNobWVudEVsZW1lbnRcclxuICAgKi9cclxuICBwcml2YXRlIHBhcnNlQXR0YWNobWVudEdlbmVyaWMoXHJcbiAgICBwYWdlOiBQYWdlLFxyXG4gICAgYXR0YWNobWVudEVsZW1lbnQ6IGNoZWVyaW8uRWxlbWVudFxyXG4gICk6IEdlbmVyaWNBdHRhY2htZW50RGF0YSB7XHJcbiAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBwYWdlXHJcbiAgICAgIC4kKGF0dGFjaG1lbnRFbGVtZW50KVxyXG4gICAgICAuZmluZCgnc3BhbicpXHJcbiAgICAgIC5jaGlsZHJlbigpXHJcbiAgICAgIC5maXJzdCgpO1xyXG4gICAgY29uc3QgdGl0bGUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbCh0aXRsZUVsZW1lbnQuaHRtbCgpKTtcclxuICAgIGNvbnN0IHRpdGxlT25DbGljayA9IHRpdGxlRWxlbWVudC5hdHRyKCdvbmNsaWNrJyk7XHJcbiAgICBpZiAoIXRpdGxlT25DbGljaylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogQXR0YWNobWVudCB0aXRsZSB3aXRob3V0IG9uY2xpY2sgZXZlbnQuJyk7XHJcbiAgICBjb25zdCBmb3JtID0gcGFnZS5wYXJzZUpTRkNMSlModGl0bGVPbkNsaWNrKTtcclxuICAgIGNvbnN0IGlkID0gZm9ybS5wb3N0VmFsdWVzLmlkO1xyXG4gICAgY29uc3QgZGVzY3JpcHRpb25FbGVtZW50ID0gcGFnZVxyXG4gICAgICAuJChhdHRhY2htZW50RWxlbWVudClcclxuICAgICAgLmZpbmQoJ2Rpdi5kZXNjcmljYW8taXRlbScpO1xyXG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChkZXNjcmlwdGlvbkVsZW1lbnQuaHRtbCgpKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHRpdGxlLFxyXG4gICAgICBmb3JtLFxyXG4gICAgICBpZCxcclxuICAgICAgaW5zdGFuY2VJbmRlbnRpZmllcjogaWQsXHJcbiAgICAgIGRlc2NyaXB0aW9uXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUGFyc2UgdGhlIHN1cnZleSAoRW5xdWV0ZSkgYXR0YWNoZWQgdG8gdGhlIGxlc3NvbiB0b3BpY1xyXG4gICAqIEBwYXJhbSBwYWdlXHJcbiAgICogQHBhcmFtIGF0dGFjaG1lbnRFbGVtZW50XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwYXJzZUF0dGFjaG1lbnRTdXJ2ZXkoXHJcbiAgICBwYWdlOiBQYWdlLFxyXG4gICAgYXR0YWNobWVudEVsZW1lbnQ6IGNoZWVyaW8uRWxlbWVudFxyXG4gICk6IFN1cnZleSB7XHJcbiAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBwYWdlLiQoYXR0YWNobWVudEVsZW1lbnQpLmZpbmQoJ3NwYW4gPiBhJyk7XHJcbiAgICBjb25zdCB0aXRsZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHRpdGxlRWxlbWVudC5odG1sKCkpO1xyXG4gICAgY29uc3QgdGl0bGVPbkNsaWNrID0gdGl0bGVFbGVtZW50LmF0dHIoJ29uY2xpY2snKTtcclxuICAgIGlmICghdGl0bGVPbkNsaWNrKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBTdXJ2ZXkgdGl0bGUgd2l0aG91dCBvbmNsaWNrIGV2ZW50LicpO1xyXG4gICAgY29uc3QgZm9ybSA9IHBhZ2UucGFyc2VKU0ZDTEpTKHRpdGxlT25DbGljayk7XHJcbiAgICBjb25zdCBzdXJ2ZXlPcHRpb25zID0ge1xyXG4gICAgICB0aXRsZSxcclxuICAgICAgZm9ybSxcclxuICAgICAgaWQ6IGZvcm0ucG9zdFZhbHVlcy5pZCxcclxuICAgICAgaW5zdGFuY2VJbmRlbnRpZmllcjogZm9ybS5wb3N0VmFsdWVzLmlkXHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIHRoaXMucmVzb3VyY2VzLnN1cnZleS51cHNlcnQoc3VydmV5T3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQYXJzZSB0aGUgaG9tZXdvcmsgYXR0YWNoZWQgdG8gdGhlIGxlc3NvbiB0b3BpY1xyXG4gICAqIEBwYXJhbSBwYWdlXHJcbiAgICogQHBhcmFtIGF0dGFjaG1lbnRFbGVtZW50XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwYXJzZUF0dGFjaG1lbnRIb21ld29yayhcclxuICAgIHBhZ2U6IFBhZ2UsXHJcbiAgICBhdHRhY2htZW50RWxlbWVudDogY2hlZXJpby5FbGVtZW50XHJcbiAgKTogSG9tZXdvcmsge1xyXG4gICAgY29uc3QgdGl0bGVFbGVtZW50ID0gcGFnZS4kKGF0dGFjaG1lbnRFbGVtZW50KS5maW5kKCdzcGFuID4gYScpO1xyXG4gICAgY29uc3QgdGl0bGVPbkNsaWNrID0gdGl0bGVFbGVtZW50LmF0dHIoJ29uY2xpY2snKTtcclxuICAgIGlmICghdGl0bGVPbkNsaWNrKVxyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBIb21ld29yayB0aXRsZSB3aXRob3V0IG9uY2xpY2sgZXZlbnQuJyk7XHJcbiAgICBjb25zdCBmb3JtID0gcGFnZS5wYXJzZUpTRkNMSlModGl0bGVPbkNsaWNrKTtcclxuICAgIGNvbnN0IGlkID0gZm9ybS5wb3N0VmFsdWVzLmlkO1xyXG4gICAgY29uc3QgdGl0bGUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbCh0aXRsZUVsZW1lbnQuaHRtbCgpKTtcclxuICAgIGNvbnN0IGRlc2NyaXB0aW9uRWxlbWVudCA9IHBhZ2VcclxuICAgICAgLiQoYXR0YWNobWVudEVsZW1lbnQpXHJcbiAgICAgIC5maW5kKCdkaXYuZGVzY3JpY2FvLWl0ZW0nKTtcclxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoZGVzY3JpcHRpb25FbGVtZW50Lmh0bWwoKSk7XHJcbiAgICBjb25zdCBkYXRlcyA9IHRoaXMucGFyc2VyLnBhcnNlRGF0ZXMoZGVzY3JpcHRpb24sIDIpO1xyXG4gICAgY29uc3Qgc3RhcnREYXRlID0gZGF0ZXNbMF07XHJcbiAgICBjb25zdCBlbmREYXRlID0gZGF0ZXNbMV07XHJcbiAgICBjb25zdCBob21ld29ya09wdGlvbnMgPSB7XHJcbiAgICAgIGlkLFxyXG4gICAgICB0aXRsZSxcclxuICAgICAgaW5zdGFuY2VJbmRlbnRpZmllcjogaWQsXHJcbiAgICAgIHN0YXJ0RGF0ZSxcclxuICAgICAgZW5kRGF0ZVxyXG4gICAgfTtcclxuXHJcbiAgICByZXR1cm4gdGhpcy5yZXNvdXJjZXMuaG9tZXdvcmsudXBzZXJ0KGhvbWV3b3JrT3B0aW9ucyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBQYXJzZSB0aGUgdmlkZW8gYXR0YWNoZWQgdG8gdGhlIGxlc3NvbiB0b3BpY1xyXG4gICAqIEBwYXJhbSBwYWdlXHJcbiAgICogQHBhcmFtIGF0dGFjaG1lbnRFbGVtZW50XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwYXJzZUF0dGFjaG1lbnRWaWRlbyhcclxuICAgIHBhZ2U6IFBhZ2UsXHJcbiAgICBhdHRhY2htZW50RWxlbWVudDogY2hlZXJpby5FbGVtZW50XHJcbiAgKTogVmlkZW9BdHRhY2htZW50IHtcclxuICAgIGNvbnN0IHRpdGxlRWxlbWVudCA9IHBhZ2VcclxuICAgICAgLiQoYXR0YWNobWVudEVsZW1lbnQpXHJcbiAgICAgIC5maW5kKCdzcGFuW2lkXSA+IHNwYW5baWRdIGEnKTtcclxuICAgIGNvbnN0IGhyZWYgPSB0aXRsZUVsZW1lbnQuYXR0cignaHJlZicpO1xyXG4gICAgY29uc3QgZGVzY3JpcHRpb25FbGVtZW50ID0gcGFnZVxyXG4gICAgICAuJChhdHRhY2htZW50RWxlbWVudClcclxuICAgICAgLmZpbmQoJ2Rpdi5kZXNjcmljYW8taXRlbScpO1xyXG5cclxuICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gdGhpcy5wYXJzZXIucmVtb3ZlVGFnc0h0bWwoZGVzY3JpcHRpb25FbGVtZW50Lmh0bWwoKSk7XHJcbiAgICBsZXQgdGl0bGUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbCh0aXRsZUVsZW1lbnQuaHRtbCgpKTtcclxuICAgIGxldCBzcmM6IHN0cmluZztcclxuICAgIGlmIChocmVmKSB7XHJcbiAgICAgIHRpdGxlID0gdGl0bGUucmVwbGFjZSgvXFwoTGluayBFeHRlcm5vXFwpJC9nLCAnJyk7XHJcbiAgICAgIHNyYyA9IGhyZWY7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCB0aXRsZUVsZW1lbnQgPSBwYWdlXHJcbiAgICAgICAgLiQoYXR0YWNobWVudEVsZW1lbnQpXHJcbiAgICAgICAgLmZpbmQoJ3NwYW5baWRdID4gc3BhbltpZF0nKTtcclxuICAgICAgdGl0bGUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbCh0aXRsZUVsZW1lbnQuaHRtbCgpKTtcclxuICAgICAgY29uc3Qgc3JjSWZyYW1lID0gcGFnZS4kKGF0dGFjaG1lbnRFbGVtZW50KS5maW5kKCdpZnJhbWUnKS5hdHRyKCdzcmMnKTtcclxuICAgICAgaWYgKCFzcmNJZnJhbWUpIHRocm93IG5ldyBFcnJvcignU0lHQUE6IFZpZGVvIGlmcmFtZSB3aXRob3V0IHVybC4nKTtcclxuICAgICAgc3JjID0gc3JjSWZyYW1lO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGU6ICd2aWRlbycsXHJcbiAgICAgIHRpdGxlLFxyXG4gICAgICBzcmMsXHJcbiAgICAgIGRlc2NyaXB0aW9uXHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogUGFyc2UgdGhlIGV4dGVybmFsIGxpbmsgYXR0YWNoZWQgdG8gdGhlIGxlc3NvbiB0b3BpY1xyXG4gICAqIEBwYXJhbSBwYWdlXHJcbiAgICogQHBhcmFtIGF0dGFjaG1lbnRFbGVtZW50XHJcbiAgICovXHJcbiAgcHJpdmF0ZSBwYXJzZUF0dGFjaG1lbnRMaW5rKFxyXG4gICAgcGFnZTogUGFnZSxcclxuICAgIGF0dGFjaG1lbnRFbGVtZW50OiBjaGVlcmlvLkVsZW1lbnRcclxuICApOiBMaW5rQXR0YWNobWVudCB7XHJcbiAgICBjb25zdCB0eXBlID0gJ2xpbmsnO1xyXG5cclxuICAgIGNvbnN0IHRpdGxlRWxlbWVudCA9IHBhZ2UuJChhdHRhY2htZW50RWxlbWVudCkuZmluZCgnc3BhbltpZF0gPiBhJyk7XHJcbiAgICBjb25zdCB0aXRsZSA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKHRpdGxlRWxlbWVudC5odG1sKCkpO1xyXG4gICAgY29uc3QgaHJlZiA9IHRpdGxlRWxlbWVudC5hdHRyKCdocmVmJyk7XHJcbiAgICBpZiAoIWhyZWYpIHRocm93IG5ldyBFcnJvcignU0lHQUE6IExpbmsgYXR0YWNobWVudCBkb2VzIG5vdCBoYXZlIGhyZWYuJyk7XHJcblxyXG4gICAgY29uc3QgZGVzY3JpcHRpb25FbGVtZW50ID0gcGFnZVxyXG4gICAgICAuJChhdHRhY2htZW50RWxlbWVudClcclxuICAgICAgLmZpbmQoJ2Rpdi5kZXNjcmljYW8taXRlbScpO1xyXG4gICAgY29uc3QgZGVzY3JpcHRpb24gPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbChkZXNjcmlwdGlvbkVsZW1lbnQuaHRtbCgpKTtcclxuICAgIHJldHVybiB7XHJcbiAgICAgIHR5cGUsXHJcbiAgICAgIHRpdGxlLFxyXG4gICAgICBocmVmLFxyXG4gICAgICBkZXNjcmlwdGlvblxyXG4gICAgfTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIFBhcnNlIHRoZSBxdWl6IChxdWVzdGlvbsOhcmlvKSBhdHRhY2hlZCB0byB0aGUgbGVzc29uIHRvcGljXHJcbiAgICogQHBhcmFtIHBhZ2VcclxuICAgKiBAcGFyYW0gYXR0YWNobWVudEVsZW1lbnRcclxuICAgKi9cclxuICBwcml2YXRlIHBhcnNlQXR0YWNobWVudFF1aXooXHJcbiAgICBwYWdlOiBQYWdlLFxyXG4gICAgYXR0YWNobWVudEVsZW1lbnQ6IGNoZWVyaW8uRWxlbWVudFxyXG4gICk6IFF1aXoge1xyXG4gICAgY29uc3QgdGl0bGVFbGVtZW50ID0gcGFnZS4kKGF0dGFjaG1lbnRFbGVtZW50KS5maW5kKCdzcGFuID4gYScpO1xyXG4gICAgY29uc3QgdGl0bGUgPSB0aGlzLnBhcnNlci5yZW1vdmVUYWdzSHRtbCh0aXRsZUVsZW1lbnQuaHRtbCgpKTtcclxuICAgIGNvbnN0IG9uQ2xpY2sgPSB0aXRsZUVsZW1lbnQuYXR0cignb25jbGljaycpO1xyXG5cclxuICAgIGlmICghb25DbGljaylcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogUXVpeiBhdHRhY2htZW50IHdpdGhvdXQgb25jbGljayBldmVudC4nKTtcclxuXHJcbiAgICBjb25zdCBmb3JtID0gcGFnZS5wYXJzZUpTRkNMSlMob25DbGljayk7XHJcbiAgICBjb25zdCBpZCA9IGZvcm0ucG9zdFZhbHVlcy5pZDtcclxuICAgIGNvbnN0IGRlc2NyaXB0aW9uRWxlbWVudCA9IHBhZ2VcclxuXHJcbiAgICAgIC4kKGF0dGFjaG1lbnRFbGVtZW50KVxyXG4gICAgICAuZmluZCgnZGl2LmRlc2NyaWNhby1pdGVtJyk7XHJcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMucGFyc2VyLnJlbW92ZVRhZ3NIdG1sKGRlc2NyaXB0aW9uRWxlbWVudC5odG1sKCkpO1xyXG4gICAgY29uc3QgZGF0ZXMgPSB0aGlzLnBhcnNlci5wYXJzZURhdGVzKGRlc2NyaXB0aW9uLCAyKTtcclxuICAgIGNvbnN0IHN0YXJ0RGF0ZSA9IGRhdGVzWzBdO1xyXG4gICAgY29uc3QgZW5kRGF0ZSA9IGRhdGVzWzFdO1xyXG5cclxuICAgIGNvbnN0IHF1aXpPcHRpb25zID0ge1xyXG4gICAgICB0aXRsZSxcclxuICAgICAgaWQsXHJcbiAgICAgIGluc3RhbmNlSW5kZW50aWZpZXI6IGlkLFxyXG4gICAgICBzdGFydERhdGUsXHJcbiAgICAgIGVuZERhdGVcclxuICAgIH07XHJcbiAgICByZXR1cm4gdGhpcy5yZXNvdXJjZXMucXVpenplcy51cHNlcnQocXVpek9wdGlvbnMpO1xyXG4gIH1cclxufVxyXG4iXX0=