"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaCourseResourcesFactory = void 0;

require("source-map-support/register");

var _sigaaNewsStudent = require("./resources/sigaa-news-student");

var _sigaaQuizStudent = require("./resources/attachments/sigaa-quiz-student");

var _sigaaFile = require("../resources/sigaa-file");

var _sigaaLessonStudent = require("./resources/sigaa-lesson-student");

var _sigaaWebContentStudent = require("./resources/attachments/sigaa-web-content-student");

var _sigaaCourseForumStudent = require("./resources/forum/sigaa-course-forum-student");

var _sigaaHomeworkStudent = require("./resources/attachments/sigaa-homework-student");

var _sigaaSurveyStudent = require("./resources/attachments/sigaa-survey-student");

var _sigaaSharedReturnDecoratorFactory = require("../helpers/sigaa-shared-return-decorator-factory");

function _decorate(decorators, factory, superClass, mixins) { var api = _getDecoratorsApi(); if (mixins) { for (var i = 0; i < mixins.length; i++) { api = mixins[i](api); } } var r = factory(function initialize(O) { api.initializeInstanceElements(O, decorated.elements); }, superClass); var decorated = api.decorateClass(_coalesceClassElements(r.d.map(_createElementDescriptor)), decorators); api.initializeClassElements(r.F, decorated.elements); return api.runClassFinishers(r.F, decorated.finishers); }

function _getDecoratorsApi() { _getDecoratorsApi = function () { return api; }; var api = { elementsDefinitionOrder: [["method"], ["field"]], initializeInstanceElements: function (O, elements) { ["method", "field"].forEach(function (kind) { elements.forEach(function (element) { if (element.kind === kind && element.placement === "own") { this.defineClassElement(O, element); } }, this); }, this); }, initializeClassElements: function (F, elements) { var proto = F.prototype; ["method", "field"].forEach(function (kind) { elements.forEach(function (element) { var placement = element.placement; if (element.kind === kind && (placement === "static" || placement === "prototype")) { var receiver = placement === "static" ? F : proto; this.defineClassElement(receiver, element); } }, this); }, this); }, defineClassElement: function (receiver, element) { var descriptor = element.descriptor; if (element.kind === "field") { var initializer = element.initializer; descriptor = { enumerable: descriptor.enumerable, writable: descriptor.writable, configurable: descriptor.configurable, value: initializer === void 0 ? void 0 : initializer.call(receiver) }; } Object.defineProperty(receiver, element.key, descriptor); }, decorateClass: function (elements, decorators) { var newElements = []; var finishers = []; var placements = { static: [], prototype: [], own: [] }; elements.forEach(function (element) { this.addElementPlacement(element, placements); }, this); elements.forEach(function (element) { if (!_hasDecorators(element)) return newElements.push(element); var elementFinishersExtras = this.decorateElement(element, placements); newElements.push(elementFinishersExtras.element); newElements.push.apply(newElements, elementFinishersExtras.extras); finishers.push.apply(finishers, elementFinishersExtras.finishers); }, this); if (!decorators) { return { elements: newElements, finishers: finishers }; } var result = this.decorateConstructor(newElements, decorators); finishers.push.apply(finishers, result.finishers); result.finishers = finishers; return result; }, addElementPlacement: function (element, placements, silent) { var keys = placements[element.placement]; if (!silent && keys.indexOf(element.key) !== -1) { throw new TypeError("Duplicated element (" + element.key + ")"); } keys.push(element.key); }, decorateElement: function (element, placements) { var extras = []; var finishers = []; for (var decorators = element.decorators, i = decorators.length - 1; i >= 0; i--) { var keys = placements[element.placement]; keys.splice(keys.indexOf(element.key), 1); var elementObject = this.fromElementDescriptor(element); var elementFinisherExtras = this.toElementFinisherExtras((0, decorators[i])(elementObject) || elementObject); element = elementFinisherExtras.element; this.addElementPlacement(element, placements); if (elementFinisherExtras.finisher) { finishers.push(elementFinisherExtras.finisher); } var newExtras = elementFinisherExtras.extras; if (newExtras) { for (var j = 0; j < newExtras.length; j++) { this.addElementPlacement(newExtras[j], placements); } extras.push.apply(extras, newExtras); } } return { element: element, finishers: finishers, extras: extras }; }, decorateConstructor: function (elements, decorators) { var finishers = []; for (var i = decorators.length - 1; i >= 0; i--) { var obj = this.fromClassDescriptor(elements); var elementsAndFinisher = this.toClassDescriptor((0, decorators[i])(obj) || obj); if (elementsAndFinisher.finisher !== undefined) { finishers.push(elementsAndFinisher.finisher); } if (elementsAndFinisher.elements !== undefined) { elements = elementsAndFinisher.elements; for (var j = 0; j < elements.length - 1; j++) { for (var k = j + 1; k < elements.length; k++) { if (elements[j].key === elements[k].key && elements[j].placement === elements[k].placement) { throw new TypeError("Duplicated element (" + elements[j].key + ")"); } } } } } return { elements: elements, finishers: finishers }; }, fromElementDescriptor: function (element) { var obj = { kind: element.kind, key: element.key, placement: element.placement, descriptor: element.descriptor }; var desc = { value: "Descriptor", configurable: true }; Object.defineProperty(obj, Symbol.toStringTag, desc); if (element.kind === "field") obj.initializer = element.initializer; return obj; }, toElementDescriptors: function (elementObjects) { if (elementObjects === undefined) return; return _toArray(elementObjects).map(function (elementObject) { var element = this.toElementDescriptor(elementObject); this.disallowProperty(elementObject, "finisher", "An element descriptor"); this.disallowProperty(elementObject, "extras", "An element descriptor"); return element; }, this); }, toElementDescriptor: function (elementObject) { var kind = String(elementObject.kind); if (kind !== "method" && kind !== "field") { throw new TypeError('An element descriptor\'s .kind property must be either "method" or' + ' "field", but a decorator created an element descriptor with' + ' .kind "' + kind + '"'); } var key = _toPropertyKey(elementObject.key); var placement = String(elementObject.placement); if (placement !== "static" && placement !== "prototype" && placement !== "own") { throw new TypeError('An element descriptor\'s .placement property must be one of "static",' + ' "prototype" or "own", but a decorator created an element descriptor' + ' with .placement "' + placement + '"'); } var descriptor = elementObject.descriptor; this.disallowProperty(elementObject, "elements", "An element descriptor"); var element = { kind: kind, key: key, placement: placement, descriptor: Object.assign({}, descriptor) }; if (kind !== "field") { this.disallowProperty(elementObject, "initializer", "A method descriptor"); } else { this.disallowProperty(descriptor, "get", "The property descriptor of a field descriptor"); this.disallowProperty(descriptor, "set", "The property descriptor of a field descriptor"); this.disallowProperty(descriptor, "value", "The property descriptor of a field descriptor"); element.initializer = elementObject.initializer; } return element; }, toElementFinisherExtras: function (elementObject) { var element = this.toElementDescriptor(elementObject); var finisher = _optionalCallableProperty(elementObject, "finisher"); var extras = this.toElementDescriptors(elementObject.extras); return { element: element, finisher: finisher, extras: extras }; }, fromClassDescriptor: function (elements) { var obj = { kind: "class", elements: elements.map(this.fromElementDescriptor, this) }; var desc = { value: "Descriptor", configurable: true }; Object.defineProperty(obj, Symbol.toStringTag, desc); return obj; }, toClassDescriptor: function (obj) { var kind = String(obj.kind); if (kind !== "class") { throw new TypeError('A class descriptor\'s .kind property must be "class", but a decorator' + ' created a class descriptor with .kind "' + kind + '"'); } this.disallowProperty(obj, "key", "A class descriptor"); this.disallowProperty(obj, "placement", "A class descriptor"); this.disallowProperty(obj, "descriptor", "A class descriptor"); this.disallowProperty(obj, "initializer", "A class descriptor"); this.disallowProperty(obj, "extras", "A class descriptor"); var finisher = _optionalCallableProperty(obj, "finisher"); var elements = this.toElementDescriptors(obj.elements); return { elements: elements, finisher: finisher }; }, runClassFinishers: function (constructor, finishers) { for (var i = 0; i < finishers.length; i++) { var newConstructor = (0, finishers[i])(constructor); if (newConstructor !== undefined) { if (typeof newConstructor !== "function") { throw new TypeError("Finishers must return a constructor."); } constructor = newConstructor; } } return constructor; }, disallowProperty: function (obj, name, objectType) { if (obj[name] !== undefined) { throw new TypeError(objectType + " can't have a ." + name + " property."); } } }; return api; }

function _createElementDescriptor(def) { var key = _toPropertyKey(def.key); var descriptor; if (def.kind === "method") { descriptor = { value: def.value, writable: true, configurable: true, enumerable: false }; } else if (def.kind === "get") { descriptor = { get: def.value, configurable: true, enumerable: false }; } else if (def.kind === "set") { descriptor = { set: def.value, configurable: true, enumerable: false }; } else if (def.kind === "field") { descriptor = { configurable: true, writable: true, enumerable: true }; } var element = { kind: def.kind === "field" ? "field" : "method", key: key, placement: def.static ? "static" : def.kind === "field" ? "own" : "prototype", descriptor: descriptor }; if (def.decorators) element.decorators = def.decorators; if (def.kind === "field") element.initializer = def.value; return element; }

function _coalesceGetterSetter(element, other) { if (element.descriptor.get !== undefined) { other.descriptor.get = element.descriptor.get; } else { other.descriptor.set = element.descriptor.set; } }

function _coalesceClassElements(elements) { var newElements = []; var isSameElement = function (other) { return other.kind === "method" && other.key === element.key && other.placement === element.placement; }; for (var i = 0; i < elements.length; i++) { var element = elements[i]; var other; if (element.kind === "method" && (other = newElements.find(isSameElement))) { if (_isDataDescriptor(element.descriptor) || _isDataDescriptor(other.descriptor)) { if (_hasDecorators(element) || _hasDecorators(other)) { throw new ReferenceError("Duplicated methods (" + element.key + ") can't be decorated."); } other.descriptor = element.descriptor; } else { if (_hasDecorators(element)) { if (_hasDecorators(other)) { throw new ReferenceError("Decorators can't be placed on different accessors with for " + "the same property (" + element.key + ")."); } other.decorators = element.decorators; } _coalesceGetterSetter(element, other); } } else { newElements.push(element); } } return newElements; }

function _hasDecorators(element) { return element.decorators && element.decorators.length; }

function _isDataDescriptor(desc) { return desc !== undefined && !(desc.value === undefined && desc.writable === undefined); }

function _optionalCallableProperty(obj, name) { var value = obj[name]; if (value !== undefined && typeof value !== "function") { throw new TypeError("Expected '" + name + "' to be a function"); } return value; }

function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }

function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }

function _toArray(arr) { return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 * Class to create instances of course resources.
 * @category Internal
 */
let SigaaCourseResourcesFactory = _decorate(null, function (_initialize) {
  class SigaaCourseResourcesFactory {
    constructor(parser) {
      this.parser = parser;

      _initialize(this);
    }

  }

  return {
    F: SigaaCourseResourcesFactory,
    d: [{
      kind: "method",
      decorators: [(0, _sigaaSharedReturnDecoratorFactory.sharedReturn)()],
      key: "createHomeworkFromHomeworkData",
      value: function createHomeworkFromHomeworkData(options, http, updateCallback) {
        return new _sigaaHomeworkStudent.SigaaHomework(http, this, options, updateCallback);
      }
    }, {
      kind: "method",
      decorators: [(0, _sigaaSharedReturnDecoratorFactory.sharedReturn)()],
      key: "createWebContentFromWebContentData",
      value: function createWebContentFromWebContentData(options, http, updateCallback) {
        return new _sigaaWebContentStudent.SigaaWebContent(http, this.parser, options, updateCallback);
      }
    }, {
      kind: "method",
      key: "createLessonFromLessonData",
      value: function createLessonFromLessonData(options, http, updateCallback) {
        return new _sigaaLessonStudent.SigaaLesson(options, updateCallback);
      }
    }, {
      kind: "method",
      decorators: [(0, _sigaaSharedReturnDecoratorFactory.sharedReturn)()],
      key: "createFileFromFileData",
      value: function createFileFromFileData(options, http, updateCallback) {
        return new _sigaaFile.SigaaFile(http, options, updateCallback);
      }
    }, {
      kind: "method",
      decorators: [(0, _sigaaSharedReturnDecoratorFactory.sharedReturn)()],
      key: "createForumFromForumData",
      value: function createForumFromForumData(options, http, updateCallback) {
        return new _sigaaCourseForumStudent.SigaaCourseForum(http, this.parser, this, options, updateCallback);
      }
    }, {
      kind: "method",
      decorators: [(0, _sigaaSharedReturnDecoratorFactory.sharedReturn)()],
      key: "createNewsFromNewsData",
      value: function createNewsFromNewsData(options, http, updateCallback) {
        return new _sigaaNewsStudent.SigaaNews(http, this.parser, options, updateCallback);
      }
    }, {
      kind: "method",
      decorators: [(0, _sigaaSharedReturnDecoratorFactory.sharedReturn)()],
      key: "createQuizFromQuizData",
      value: function createQuizFromQuizData(options, http, updateCallback) {
        return new _sigaaQuizStudent.SigaaQuiz(http, options, updateCallback);
      }
    }, {
      kind: "method",
      decorators: [(0, _sigaaSharedReturnDecoratorFactory.sharedReturn)()],
      key: "createSurveyFromSurveyData",
      value: function createSurveyFromSurveyData(options, http, updateCallback) {
        return new _sigaaSurveyStudent.SigaaSurvey(options, updateCallback);
      }
    }]
  };
});

exports.SigaaCourseResourcesFactory = SigaaCourseResourcesFactory;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3Vyc2VzL3NpZ2FhLWNvdXJzZS1yZXNvdXJjZXMtZmFjdG9yeS50cyJdLCJuYW1lcyI6WyJTaWdhYUNvdXJzZVJlc291cmNlc0ZhY3RvcnkiLCJjb25zdHJ1Y3RvciIsInBhcnNlciIsIm9wdGlvbnMiLCJodHRwIiwidXBkYXRlQ2FsbGJhY2siLCJTaWdhYUhvbWV3b3JrIiwiU2lnYWFXZWJDb250ZW50IiwiU2lnYWFMZXNzb24iLCJTaWdhYUZpbGUiLCJTaWdhYUNvdXJzZUZvcnVtIiwiU2lnYWFOZXdzIiwiU2lnYWFRdWl6IiwiU2lnYWFTdXJ2ZXkiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUlBOztBQUNBOztBQUNBOztBQUVBOztBQU1BOztBQU1BOztBQU1BOztBQUtBOztBQUtBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0RBO0FBQ0E7QUFDQTtBQUNBO0lBQ2FBLDJCO0FBQU4sUUFBTUEsMkJBQU4sQ0FBb0U7QUFDekVDLElBQUFBLFdBQVcsQ0FBU0MsTUFBVCxFQUF5QjtBQUFBLFdBQWhCQSxNQUFnQixHQUFoQkEsTUFBZ0I7O0FBQUE7QUFBRTs7QUFEbUM7OztPQUE5REYsMkI7OzttQkFHVixzRDs7YUFBRCx3Q0FFRUcsT0FGRixFQUdFQyxJQUhGLEVBSUVDLGNBSkYsRUFLaUI7QUFDZixlQUFPLElBQUlDLG1DQUFKLENBQWtCRixJQUFsQixFQUF3QixJQUF4QixFQUE4QkQsT0FBOUIsRUFBdUNFLGNBQXZDLENBQVA7QUFDRDs7O21CQUVBLHNEOzthQUFELDRDQUVFRixPQUZGLEVBR0VDLElBSEYsRUFJRUMsY0FKRixFQUttQjtBQUNqQixlQUFPLElBQUlFLHVDQUFKLENBQW9CSCxJQUFwQixFQUEwQixLQUFLRixNQUEvQixFQUF1Q0MsT0FBdkMsRUFBZ0RFLGNBQWhELENBQVA7QUFDRDs7OzthQUVELG9DQUNFRixPQURGLEVBRUVDLElBRkYsRUFHRUMsY0FIRixFQUllO0FBQ2IsZUFBTyxJQUFJRywrQkFBSixDQUFnQkwsT0FBaEIsRUFBeUJFLGNBQXpCLENBQVA7QUFDRDs7O21CQUVBLHNEOzthQUFELGdDQUVFRixPQUZGLEVBR0VDLElBSEYsRUFJRUMsY0FKRixFQUthO0FBQ1gsZUFBTyxJQUFJSSxvQkFBSixDQUFjTCxJQUFkLEVBQW9CRCxPQUFwQixFQUE2QkUsY0FBN0IsQ0FBUDtBQUNEOzs7bUJBRUEsc0Q7O2FBQUQsa0NBRUVGLE9BRkYsRUFHRUMsSUFIRixFQUlFQyxjQUpGLEVBS29CO0FBQ2xCLGVBQU8sSUFBSUsseUNBQUosQ0FDTE4sSUFESyxFQUVMLEtBQUtGLE1BRkEsRUFHTCxJQUhLLEVBSUxDLE9BSkssRUFLTEUsY0FMSyxDQUFQO0FBT0Q7OzttQkFFQSxzRDs7YUFBRCxnQ0FFRUYsT0FGRixFQUdFQyxJQUhGLEVBSUVDLGNBSkYsRUFLYTtBQUNYLGVBQU8sSUFBSU0sMkJBQUosQ0FBY1AsSUFBZCxFQUFvQixLQUFLRixNQUF6QixFQUFpQ0MsT0FBakMsRUFBMENFLGNBQTFDLENBQVA7QUFDRDs7O21CQUVBLHNEOzthQUFELGdDQUVFRixPQUZGLEVBR0VDLElBSEYsRUFJRUMsY0FKRixFQUthO0FBQ1gsZUFBTyxJQUFJTywyQkFBSixDQUFjUixJQUFkLEVBQW9CRCxPQUFwQixFQUE2QkUsY0FBN0IsQ0FBUDtBQUNEOzs7bUJBRUEsc0Q7O2FBQUQsb0NBRUVGLE9BRkYsRUFHRUMsSUFIRixFQUlFQyxjQUpGLEVBS2U7QUFDYixlQUFPLElBQUlRLCtCQUFKLENBQWdCVixPQUFoQixFQUF5QkUsY0FBekIsQ0FBUDtBQUNEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSAnQGhlbHBlcnMvc2lnYWEtcGFyc2VyJztcclxuaW1wb3J0IHsgSFRUUCB9IGZyb20gJ0BzZXNzaW9uL3NpZ2FhLWh0dHAnO1xyXG5cclxuaW1wb3J0IHsgVXBkYXRhYmxlUmVzb3VyY2VDYWxsYmFjayB9IGZyb20gJ0ByZXNvdXJjZXMvdXBkYXRhYmxlLXJlc291cmNlJztcclxuaW1wb3J0IHsgTmV3cywgTmV3c0RhdGEsIFNpZ2FhTmV3cyB9IGZyb20gJ0Bjb3Vyc2VSZXNvdXJjZXMvc2lnYWEtbmV3cy1zdHVkZW50JztcclxuaW1wb3J0IHsgUXVpeiwgUXVpekRhdGEsIFNpZ2FhUXVpeiB9IGZyb20gJ0BhdHRhY2htZW50cy9zaWdhYS1xdWl6LXN0dWRlbnQnO1xyXG5pbXBvcnQgeyBGaWxlRGF0YSwgU2lnYWFGaWxlLCBGaWxlIH0gZnJvbSAnQHJlc291cmNlcy9zaWdhYS1maWxlJztcclxuXHJcbmltcG9ydCB7XHJcbiAgTGVzc29uLFxyXG4gIExlc3NvbkRhdGEsXHJcbiAgU2lnYWFMZXNzb25cclxufSBmcm9tICcuL3Jlc291cmNlcy9zaWdhYS1sZXNzb24tc3R1ZGVudCc7XHJcblxyXG5pbXBvcnQge1xyXG4gIFNpZ2FhV2ViQ29udGVudCxcclxuICBXZWJDb250ZW50LFxyXG4gIFdlYkNvbnRlbnREYXRhXHJcbn0gZnJvbSAnQGF0dGFjaG1lbnRzL3NpZ2FhLXdlYi1jb250ZW50LXN0dWRlbnQnO1xyXG5cclxuaW1wb3J0IHtcclxuICBDb3Vyc2VGb3J1bSxcclxuICBGb3J1bURhdGEsXHJcbiAgU2lnYWFDb3Vyc2VGb3J1bVxyXG59IGZyb20gJ0Bjb3Vyc2VSZXNvdXJjZXMvZm9ydW0vc2lnYWEtY291cnNlLWZvcnVtLXN0dWRlbnQnO1xyXG5cclxuaW1wb3J0IHtcclxuICBIb21ld29yayxcclxuICBIb21ld29ya0RhdGEsXHJcbiAgU2lnYWFIb21ld29ya1xyXG59IGZyb20gJ0BhdHRhY2htZW50cy9zaWdhYS1ob21ld29yay1zdHVkZW50JztcclxuaW1wb3J0IHtcclxuICBTaWdhYVN1cnZleSxcclxuICBTdXJ2ZXksXHJcbiAgU3VydmV5RGF0YVxyXG59IGZyb20gJ0BhdHRhY2htZW50cy9zaWdhYS1zdXJ2ZXktc3R1ZGVudCc7XHJcbmltcG9ydCB7IHNoYXJlZFJldHVybiB9IGZyb20gJ0BoZWxwZXJzL3NpZ2FhLXNoYXJlZC1yZXR1cm4tZGVjb3JhdG9yLWZhY3RvcnknO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBpbnN0YW5jZXMgb2YgY291cnNlIHJlc291cmNlcy5cclxuICogQGNhdGVnb3J5IEludGVybmFsXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIENvdXJzZVJlc291cmNlc0ZhY3Rvcnkge1xyXG4gIGNyZWF0ZVdlYkNvbnRlbnRGcm9tV2ViQ29udGVudERhdGEoXHJcbiAgICBvcHRpb25zOiBXZWJDb250ZW50RGF0YSxcclxuICAgIGh0dHA6IEhUVFAsXHJcbiAgICB1cGRhdGVDYWxsYmFjazogVXBkYXRhYmxlUmVzb3VyY2VDYWxsYmFja1xyXG4gICk6IFdlYkNvbnRlbnQ7XHJcblxyXG4gIGNyZWF0ZUxlc3NvbkZyb21MZXNzb25EYXRhKFxyXG4gICAgb3B0aW9uczogTGVzc29uRGF0YSxcclxuICAgIGh0dHA6IEhUVFAsXHJcbiAgICB1cGRhdGVDYWxsYmFjazogVXBkYXRhYmxlUmVzb3VyY2VDYWxsYmFja1xyXG4gICk6IExlc3NvbjtcclxuXHJcbiAgY3JlYXRlRmlsZUZyb21GaWxlRGF0YShcclxuICAgIG9wdGlvbnM6IEZpbGVEYXRhLFxyXG4gICAgaHR0cDogSFRUUCxcclxuICAgIHVwZGF0ZUNhbGxiYWNrOiBVcGRhdGFibGVSZXNvdXJjZUNhbGxiYWNrXHJcbiAgKTogRmlsZTtcclxuXHJcbiAgY3JlYXRlSG9tZXdvcmtGcm9tSG9tZXdvcmtEYXRhKFxyXG4gICAgaG9tZXdvcmtPcHRpb25zOiBIb21ld29ya0RhdGEsXHJcbiAgICBodHRwOiBIVFRQLFxyXG4gICAgdXBkYXRlQ2FsbGJhY2s6IFVwZGF0YWJsZVJlc291cmNlQ2FsbGJhY2tcclxuICApOiBIb21ld29yaztcclxuXHJcbiAgY3JlYXRlRm9ydW1Gcm9tRm9ydW1EYXRhKFxyXG4gICAgb3B0aW9uczogRm9ydW1EYXRhLFxyXG4gICAgaHR0cDogSFRUUCxcclxuICAgIHVwZGF0ZUNhbGxiYWNrOiBVcGRhdGFibGVSZXNvdXJjZUNhbGxiYWNrXHJcbiAgKTogQ291cnNlRm9ydW07XHJcblxyXG4gIGNyZWF0ZU5ld3NGcm9tTmV3c0RhdGEoXHJcbiAgICBuZXdzT3B0aW9uczogTmV3c0RhdGEsXHJcbiAgICBodHRwOiBIVFRQLFxyXG4gICAgdXBkYXRlQ2FsbGJhY2s6IFVwZGF0YWJsZVJlc291cmNlQ2FsbGJhY2tcclxuICApOiBOZXdzO1xyXG5cclxuICBjcmVhdGVRdWl6RnJvbVF1aXpEYXRhKFxyXG4gICAgcXVpekRhdGE6IFF1aXpEYXRhLFxyXG4gICAgaHR0cDogSFRUUCxcclxuICAgIHVwZGF0ZUNhbGxiYWNrOiBVcGRhdGFibGVSZXNvdXJjZUNhbGxiYWNrXHJcbiAgKTogUXVpejtcclxuXHJcbiAgY3JlYXRlU3VydmV5RnJvbVN1cnZleURhdGEoXHJcbiAgICBzdXJ2ZXlEYXRhOiBTdXJ2ZXlEYXRhLFxyXG4gICAgaHR0cDogSFRUUCxcclxuICAgIHVwZGF0ZUNhbGxiYWNrOiBVcGRhdGFibGVSZXNvdXJjZUNhbGxiYWNrXHJcbiAgKTogU3VydmV5O1xyXG59XHJcblxyXG4vKipcclxuICogQ2xhc3MgdG8gY3JlYXRlIGluc3RhbmNlcyBvZiBjb3Vyc2UgcmVzb3VyY2VzLlxyXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcclxuICovXHJcbmV4cG9ydCBjbGFzcyBTaWdhYUNvdXJzZVJlc291cmNlc0ZhY3RvcnkgaW1wbGVtZW50cyBDb3Vyc2VSZXNvdXJjZXNGYWN0b3J5IHtcclxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHBhcnNlcjogUGFyc2VyKSB7fVxyXG5cclxuICBAc2hhcmVkUmV0dXJuKClcclxuICBjcmVhdGVIb21ld29ya0Zyb21Ib21ld29ya0RhdGEoXHJcbiAgICBvcHRpb25zOiBIb21ld29ya0RhdGEsXHJcbiAgICBodHRwOiBIVFRQLFxyXG4gICAgdXBkYXRlQ2FsbGJhY2s6IFVwZGF0YWJsZVJlc291cmNlQ2FsbGJhY2tcclxuICApOiBTaWdhYUhvbWV3b3JrIHtcclxuICAgIHJldHVybiBuZXcgU2lnYWFIb21ld29yayhodHRwLCB0aGlzLCBvcHRpb25zLCB1cGRhdGVDYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBAc2hhcmVkUmV0dXJuKClcclxuICBjcmVhdGVXZWJDb250ZW50RnJvbVdlYkNvbnRlbnREYXRhKFxyXG4gICAgb3B0aW9uczogV2ViQ29udGVudERhdGEsXHJcbiAgICBodHRwOiBIVFRQLFxyXG4gICAgdXBkYXRlQ2FsbGJhY2s6IFVwZGF0YWJsZVJlc291cmNlQ2FsbGJhY2tcclxuICApOiBTaWdhYVdlYkNvbnRlbnQge1xyXG4gICAgcmV0dXJuIG5ldyBTaWdhYVdlYkNvbnRlbnQoaHR0cCwgdGhpcy5wYXJzZXIsIG9wdGlvbnMsIHVwZGF0ZUNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIGNyZWF0ZUxlc3NvbkZyb21MZXNzb25EYXRhKFxyXG4gICAgb3B0aW9uczogTGVzc29uRGF0YSxcclxuICAgIGh0dHA6IEhUVFAsXHJcbiAgICB1cGRhdGVDYWxsYmFjazogVXBkYXRhYmxlUmVzb3VyY2VDYWxsYmFja1xyXG4gICk6IFNpZ2FhTGVzc29uIHtcclxuICAgIHJldHVybiBuZXcgU2lnYWFMZXNzb24ob3B0aW9ucywgdXBkYXRlQ2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgQHNoYXJlZFJldHVybigpXHJcbiAgY3JlYXRlRmlsZUZyb21GaWxlRGF0YShcclxuICAgIG9wdGlvbnM6IEZpbGVEYXRhLFxyXG4gICAgaHR0cDogSFRUUCxcclxuICAgIHVwZGF0ZUNhbGxiYWNrOiBVcGRhdGFibGVSZXNvdXJjZUNhbGxiYWNrXHJcbiAgKTogU2lnYWFGaWxlIHtcclxuICAgIHJldHVybiBuZXcgU2lnYWFGaWxlKGh0dHAsIG9wdGlvbnMsIHVwZGF0ZUNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIEBzaGFyZWRSZXR1cm4oKVxyXG4gIGNyZWF0ZUZvcnVtRnJvbUZvcnVtRGF0YShcclxuICAgIG9wdGlvbnM6IEZvcnVtRGF0YSxcclxuICAgIGh0dHA6IEhUVFAsXHJcbiAgICB1cGRhdGVDYWxsYmFjazogVXBkYXRhYmxlUmVzb3VyY2VDYWxsYmFja1xyXG4gICk6IFNpZ2FhQ291cnNlRm9ydW0ge1xyXG4gICAgcmV0dXJuIG5ldyBTaWdhYUNvdXJzZUZvcnVtKFxyXG4gICAgICBodHRwLFxyXG4gICAgICB0aGlzLnBhcnNlcixcclxuICAgICAgdGhpcyxcclxuICAgICAgb3B0aW9ucyxcclxuICAgICAgdXBkYXRlQ2FsbGJhY2tcclxuICAgICk7XHJcbiAgfVxyXG5cclxuICBAc2hhcmVkUmV0dXJuKClcclxuICBjcmVhdGVOZXdzRnJvbU5ld3NEYXRhKFxyXG4gICAgb3B0aW9uczogTmV3c0RhdGEsXHJcbiAgICBodHRwOiBIVFRQLFxyXG4gICAgdXBkYXRlQ2FsbGJhY2s6IFVwZGF0YWJsZVJlc291cmNlQ2FsbGJhY2tcclxuICApOiBTaWdhYU5ld3Mge1xyXG4gICAgcmV0dXJuIG5ldyBTaWdhYU5ld3MoaHR0cCwgdGhpcy5wYXJzZXIsIG9wdGlvbnMsIHVwZGF0ZUNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIEBzaGFyZWRSZXR1cm4oKVxyXG4gIGNyZWF0ZVF1aXpGcm9tUXVpekRhdGEoXHJcbiAgICBvcHRpb25zOiBRdWl6RGF0YSxcclxuICAgIGh0dHA6IEhUVFAsXHJcbiAgICB1cGRhdGVDYWxsYmFjazogVXBkYXRhYmxlUmVzb3VyY2VDYWxsYmFja1xyXG4gICk6IFNpZ2FhUXVpeiB7XHJcbiAgICByZXR1cm4gbmV3IFNpZ2FhUXVpeihodHRwLCBvcHRpb25zLCB1cGRhdGVDYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBAc2hhcmVkUmV0dXJuKClcclxuICBjcmVhdGVTdXJ2ZXlGcm9tU3VydmV5RGF0YShcclxuICAgIG9wdGlvbnM6IFN1cnZleURhdGEsXHJcbiAgICBodHRwOiBIVFRQLFxyXG4gICAgdXBkYXRlQ2FsbGJhY2s6IFVwZGF0YWJsZVJlc291cmNlQ2FsbGJhY2tcclxuICApOiBTaWdhYVN1cnZleSB7XHJcbiAgICByZXR1cm4gbmV3IFNpZ2FhU3VydmV5KG9wdGlvbnMsIHVwZGF0ZUNhbGxiYWNrKTtcclxuICB9XHJcbn1cclxuIl19