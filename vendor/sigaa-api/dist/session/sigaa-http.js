"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SigaaHTTP = void 0;

require("source-map-support/register");

var path = _interopRequireWildcard(require("path"));

var fs = _interopRequireWildcard(require("fs"));

var _iconvLite = _interopRequireDefault(require("iconv-lite"));

var _https = require("https");

var _zlib = require("zlib");

var _querystring = require("querystring");

var _sigaaPageIfsc = require("./page/sigaa-page-ifsc");

var _sigaaPageUfpb = require("./page/sigaa-page-ufpb");

var _sigaaPageUnb = require("./page/sigaa-page-unb");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

/**
 * HTTP request class
 * @param sigaaSession A instance of SigaaSession
 *
 * @category Internal
 */
class SigaaHTTP {
  constructor(httpSession) {
    this.httpSession = httpSession;
  }
  /**
   * @inheritdoc
   */


  async downloadFileByGet(urlPath, basepath, callback) {
    const url = this.httpSession.getURL(urlPath);
    const httpOptions = this.getRequestBasicOptions('GET', url);
    return this.downloadFile(url, basepath, httpOptions, undefined, callback);
  }
  /**
   * @inheritdoc
   */


  downloadFileByPost(urlPath, postValues, basepath, callback) {
    const url = this.httpSession.getURL(urlPath);
    const {
      httpOptions,
      body
    } = this.encodePostValue(url, postValues);
    return this.downloadFile(url, basepath, httpOptions, body, callback);
  }
  /**
   * @inheritdoc
   */


  async downloadFile(url, basepath, httpOptions, body, callback) {
    const sessionHttpOptions = await this.httpSession.afterHTTPOptions(url, httpOptions);
    const fileStats = await fs.promises.lstat(basepath);

    if (!(fileStats.isDirectory() || fileStats.isFile())) {
      throw new Error('SIGAA: Download basepath not exists.');
    }

    const suspendRequest = await this.httpSession.beforeDownloadRequest(url, basepath, sessionHttpOptions, body, callback);
    if (suspendRequest) return suspendRequest;
    const {
      bodyStream,
      headers,
      statusCode
    } = await this.requestHTTP(httpOptions, body);
    if (statusCode === 302) throw new Error('SIGAA: Download expired.');
    if (statusCode !== 200) throw new Error('SIGAA: Invalid status code at download file page.');
    let filepath;

    if (fileStats.isDirectory()) {
      if (headers['content-disposition']) {
        const filename = headers['content-disposition'].replace(/([\S\s]*?)filename="/gm, '').slice(0, -1);
        filepath = path.join(basepath, filename);
      } else {
        throw new Error('SIGAA: Invalid response at download file page.');
      }
    } else {
      filepath = basepath;
    }

    const file = fs.createWriteStream(filepath);
    bodyStream.pipe(file); // save to file

    if (callback) {
      bodyStream.on('data', () => {
        callback(file.bytesWritten);
      });
    }

    const finalPath = await new Promise((resolve, reject) => {
      file.on('finish', () => {
        file.close(); // close() is sync, call resolve after close completes.

        resolve(filepath);
      });
      bodyStream.on('error', err => {
        file.close();
        fs.promises.unlink(filepath);
        reject(err);
      });
      file.on('error', err => {
        file.close();
        fs.unlinkSync(filepath);
        reject(err);
      });
    });
    return this.httpSession.afterDownloadRequest(url, basepath, sessionHttpOptions, finalPath, body, callback);
  }
  /**
   * @inheritdoc
   */


  closeSession() {
    this.httpSession.close();
  }
  /**
   * Create object Options for https.request
   * @param method HTTP method POST or GET
   * @param link URL of Request
   * @param options
   * @param [options.withoutCookies=true] Disable cookies in headers, default = true
   * @param [options.mobile=false] Use mobile User-Agent
   * @returns The basic options for request
   */


  getRequestBasicOptions(method, link, additionalHeaders, options = {
    mobile: false
  }) {
    const basicOptions = {
      hostname: link.hostname,
      port: 443,
      path: link.pathname + link.search,
      method: method,
      headers: {
        'User-Agent': `SIGAA-Api/1.0 (${options.mobile ? 'Android 7.0; ' : ''}https://github.com/GeovaneSchmitz/sigaa-api)`,
        'Accept-Encoding': 'br, gzip, deflate',
        Accept: '*/*',
        'Cache-Control': 'max-age=0',
        DNT: '1',
        ...additionalHeaders
      }
    };
    return basicOptions;
  }
  /**
   * @inheritdoc
   */


  async postMultipart(path, formData, options) {
    const url = this.httpSession.getURL(path);
    const httpOptions = this.getRequestBasicOptions('POST', url, formData.headers, options);
    const buffer = await this.convertReadebleToBuffer(formData.stream);
    return this.requestPage(url, httpOptions, buffer);
  }
  /**
   * Convert stream.Readable to buffer
   * @param stream readable stream
   */


  convertReadebleToBuffer(stream) {
    const buffers = [];
    return new Promise((resolve, reject) => {
      stream.on('data', data => {
        if (typeof data === 'string') {
          buffers.push(Buffer.from(data));
        } else {
          buffers.push(data);
        }
      });
      stream.on('close', () => {
        const buffer = Buffer.concat(buffers);
        resolve(buffer);
      });
      stream.on('error', err => {
        reject(err);
      });
    });
  }
  /**
   * RFC 3986
   * Uses the UTF-8 code point to code, not the hexadecimal binary
   * @param str
   */


  encodeWithRFC3986(str) {
    let escapedString = '';
    const unreservedCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.~';

    for (let i = 0; i < str.length; i++) {
      if (unreservedCharacters.includes(str.charAt(i))) {
        escapedString += str.charAt(i);
      } else {
        const codePoint = str.codePointAt(i);
        if (codePoint === undefined) throw new Error('SIGAA: Invalid code point.');
        codePoint.toString(16).replace(/..?/g, '%$&');
        escapedString += codePoint.toString(16).replace(/..?/g, '%$&');
      }
    }

    return escapedString;
  }
  /**
   * @inheritdoc
   */


  async post(path, postValues, options = {}) {
    const url = this.httpSession.getURL(path);
    const {
      httpOptions,
      body
    } = this.encodePostValue(url, postValues, options);
    return this.requestPage(url, httpOptions, body, options);
  }
  /**
   * Generate body and headers for post request
   * @param postValues
   * @param url
   * @param options
   */


  encodePostValue(url, postValues, options) {
    const body = (0, _querystring.stringify)(postValues, '&', '=', {
      encodeURIComponent: this.encodeWithRFC3986
    });
    const httpOptions = this.getRequestBasicOptions('POST', url, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body).toString(10)
    }, options);
    return {
      httpOptions,
      body
    };
  }

  async get(path, options) {
    const url = this.httpSession.getURL(path);
    const httpOptions = this.getRequestBasicOptions('GET', url, undefined, options);
    return this.requestPage(url, httpOptions, undefined, options);
  }
  /**
   * Make a HTTP request for a page
   * @param url url of request
   * @param options http.request options
   * @param [requestBody] body of request
   */


  async requestPage(url, httpOptions, requestBody, options) {
    try {
      const sessionHttpOptions = await this.httpSession.afterHTTPOptions(url, httpOptions, requestBody, options);
      const pageBeforeRequest = await this.httpSession.beforeRequest(url, sessionHttpOptions, requestBody, options);

      if (pageBeforeRequest) {
        return this.httpSession.afterSuccessfulRequest(pageBeforeRequest, options);
      }

      const {
        bodyStream,
        headers,
        statusCode
      } = await this.requestHTTP(httpOptions, requestBody);
      const bodyBuffer = await this.convertReadebleToBuffer(bodyStream);
      const SigaaPageInstitution = {
        IFSC: _sigaaPageIfsc.SigaaPageIFSC,
        UFPB: _sigaaPageUfpb.SigaaPageUFPB,
        UNB: _sigaaPageUnb.SigaaPageUNB,
        UFRPE: _sigaaPageUnb.SigaaPageUNB
      };
      const page = new SigaaPageInstitution[this.httpSession.institutionController.institution]({
        requestOptions: httpOptions,
        body: bodyBuffer.toString(),
        url,
        headers,
        statusCode,
        requestBody
      });
      return this.httpSession.afterSuccessfulRequest(page, options);
    } catch (err) {
      return this.httpSession.afterUnsuccessfulRequest(err, httpOptions, requestBody);
    }
  }
  /**
   * Make a HTTP request
   * @param optionsHTTP http.request options
   * @param [body] body of request
   */


  async requestHTTP(optionsHTTP, body) {
    return new Promise((resolve, reject) => {
      const req = (0, _https.request)(optionsHTTP, response => {
        resolve(this.parserResponse(response));
      });
      req.on('error', err => {
        reject(err);
      });
      if (body) req.write(body);
      req.end();
    });
  }

  parserResponse(response) {
    return new Promise((resolve, reject) => {
      var _response$headers$con;

      let streamDecompressed = undefined;

      switch (response.headers['content-encoding']) {
        case 'br':
          streamDecompressed = (0, _zlib.createBrotliDecompress)();
          response.pipe(streamDecompressed);
          break;

        case 'gzip':
          streamDecompressed = (0, _zlib.createGunzip)();
          response.pipe(streamDecompressed);
          break;

        case 'deflate':
          streamDecompressed = (0, _zlib.createInflate)();
          response.pipe(streamDecompressed);
          break;
      }

      response.on('error', err => {
        if (streamDecompressed) {
          streamDecompressed.end();
        }

        reject(err);
      });
      response.on('close', () => {
        if (streamDecompressed) {
          streamDecompressed.end();
        }
      });

      if (Array.isArray(response.headers.location)) {
        response.headers.location = response.headers.location[0];
      }

      const contentTypeEncoding = (_response$headers$con = response.headers['content-type']) === null || _response$headers$con === void 0 ? void 0 : _response$headers$con.match(/charset=[^;]+/);
      let bodyStream = streamDecompressed || response;
      let iconvStream = undefined;

      if (contentTypeEncoding) {
        const encoding = contentTypeEncoding[0].replace(/^charset=/, '');
        iconvStream = _iconvLite.default.decodeStream(encoding);
        bodyStream = bodyStream.pipe(iconvStream);
      }

      resolve({
        bodyStream,
        headers: response.headers,
        statusCode: response.statusCode
      });
    });
  }

  async followAllRedirect(page, options) {
    while (page.headers.location) {
      page = await this.get(page.headers.location, options);
    }

    return page;
  }

}

exports.SigaaHTTP = SigaaHTTP;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9zZXNzaW9uL3NpZ2FhLWh0dHAudHMiXSwibmFtZXMiOlsiU2lnYWFIVFRQIiwiY29uc3RydWN0b3IiLCJodHRwU2Vzc2lvbiIsImRvd25sb2FkRmlsZUJ5R2V0IiwidXJsUGF0aCIsImJhc2VwYXRoIiwiY2FsbGJhY2siLCJ1cmwiLCJnZXRVUkwiLCJodHRwT3B0aW9ucyIsImdldFJlcXVlc3RCYXNpY09wdGlvbnMiLCJkb3dubG9hZEZpbGUiLCJ1bmRlZmluZWQiLCJkb3dubG9hZEZpbGVCeVBvc3QiLCJwb3N0VmFsdWVzIiwiYm9keSIsImVuY29kZVBvc3RWYWx1ZSIsInNlc3Npb25IdHRwT3B0aW9ucyIsImFmdGVySFRUUE9wdGlvbnMiLCJmaWxlU3RhdHMiLCJmcyIsInByb21pc2VzIiwibHN0YXQiLCJpc0RpcmVjdG9yeSIsImlzRmlsZSIsIkVycm9yIiwic3VzcGVuZFJlcXVlc3QiLCJiZWZvcmVEb3dubG9hZFJlcXVlc3QiLCJib2R5U3RyZWFtIiwiaGVhZGVycyIsInN0YXR1c0NvZGUiLCJyZXF1ZXN0SFRUUCIsImZpbGVwYXRoIiwiZmlsZW5hbWUiLCJyZXBsYWNlIiwic2xpY2UiLCJwYXRoIiwiam9pbiIsImZpbGUiLCJjcmVhdGVXcml0ZVN0cmVhbSIsInBpcGUiLCJvbiIsImJ5dGVzV3JpdHRlbiIsImZpbmFsUGF0aCIsIlByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiY2xvc2UiLCJlcnIiLCJ1bmxpbmsiLCJ1bmxpbmtTeW5jIiwiYWZ0ZXJEb3dubG9hZFJlcXVlc3QiLCJjbG9zZVNlc3Npb24iLCJtZXRob2QiLCJsaW5rIiwiYWRkaXRpb25hbEhlYWRlcnMiLCJvcHRpb25zIiwibW9iaWxlIiwiYmFzaWNPcHRpb25zIiwiaG9zdG5hbWUiLCJwb3J0IiwicGF0aG5hbWUiLCJzZWFyY2giLCJBY2NlcHQiLCJETlQiLCJwb3N0TXVsdGlwYXJ0IiwiZm9ybURhdGEiLCJidWZmZXIiLCJjb252ZXJ0UmVhZGVibGVUb0J1ZmZlciIsInN0cmVhbSIsInJlcXVlc3RQYWdlIiwiYnVmZmVycyIsImRhdGEiLCJwdXNoIiwiQnVmZmVyIiwiZnJvbSIsImNvbmNhdCIsImVuY29kZVdpdGhSRkMzOTg2Iiwic3RyIiwiZXNjYXBlZFN0cmluZyIsInVucmVzZXJ2ZWRDaGFyYWN0ZXJzIiwiaSIsImxlbmd0aCIsImluY2x1ZGVzIiwiY2hhckF0IiwiY29kZVBvaW50IiwiY29kZVBvaW50QXQiLCJ0b1N0cmluZyIsInBvc3QiLCJlbmNvZGVVUklDb21wb25lbnQiLCJieXRlTGVuZ3RoIiwiZ2V0IiwicmVxdWVzdEJvZHkiLCJwYWdlQmVmb3JlUmVxdWVzdCIsImJlZm9yZVJlcXVlc3QiLCJhZnRlclN1Y2Nlc3NmdWxSZXF1ZXN0IiwiYm9keUJ1ZmZlciIsIlNpZ2FhUGFnZUluc3RpdHV0aW9uIiwiSUZTQyIsIlNpZ2FhUGFnZUlGU0MiLCJVRlBCIiwiU2lnYWFQYWdlVUZQQiIsIlVOQiIsIlNpZ2FhUGFnZVVOQiIsIlVGUlBFIiwicGFnZSIsImluc3RpdHV0aW9uQ29udHJvbGxlciIsImluc3RpdHV0aW9uIiwicmVxdWVzdE9wdGlvbnMiLCJhZnRlclVuc3VjY2Vzc2Z1bFJlcXVlc3QiLCJvcHRpb25zSFRUUCIsInJlcSIsInJlc3BvbnNlIiwicGFyc2VyUmVzcG9uc2UiLCJ3cml0ZSIsImVuZCIsInN0cmVhbURlY29tcHJlc3NlZCIsIkFycmF5IiwiaXNBcnJheSIsImxvY2F0aW9uIiwiY29udGVudFR5cGVFbmNvZGluZyIsIm1hdGNoIiwiaWNvbnZTdHJlYW0iLCJlbmNvZGluZyIsImljb252IiwiZGVjb2RlU3RyZWFtIiwiZm9sbG93QWxsUmVkaXJlY3QiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBOztBQUNBOztBQUVBOztBQUdBOztBQUNBOztBQUNBOztBQUtBOztBQUNBOztBQUNBOzs7Ozs7OztBQWtIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDTyxNQUFNQSxTQUFOLENBQWdDO0FBQ3JDQyxFQUFBQSxXQUFXLENB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RixLQUFsQyxDQUF3QyxlQUF4QyxDQURGO0FBR0EsVUFBSTdGLFVBR3NCLEdBQUd3RixrQkFBa0IsSUFBSUosUUFIbkQ7QUFLQSxVQUFJVSxXQUErQyxHQUFHOUcsU0FBdEQ7O0FBQ0EsVUFBSTRHLG1CQUFKLEVBQXlCO0FBQ3ZCLGNBQU1HLFFBQVEsR0FBR0gsbUJBQW1CLENBQUMsQ0FBRCxDQUFuQixDQUF1QnRGLE9BQXZCLENBQStCLFdBQS9CLEVBQTRDLEVBQTVDLENBQWpCO0FBRUF3RixRQUFBQSxXQUFXLEdBQUdFLG1CQUFNQyxZQUFOLENBQW1CRixRQUFuQixDQUFkO0FBRUEvRixRQUFBQSxVQUFVLEdBQUdBLFVBQVUsQ0FBQ1ksSUFBWCxDQUFnQmtGLFdBQWhCLENBQWI7QUFDRDs7QUFDRDdFLE1BQUFBLE9BQU8sQ0FBQztBQUNOakIsUUFBQUEsVUFETTtBQUVOQyxRQUFBQSxPQUFPLEVBQUVtRixRQUFRLENBQUNuRixPQUZaO0FBR05DLFFBQUFBLFVBQVUsRUFBRWtGLFFBQVEsQ0FBQ2xGO0FBSGYsT0FBRCxDQUFQO0FBS0QsS0FwRE0sQ0FBUDtBQXFERDs7QUFFNkIsUUFBakJnRyxpQkFBaUIsQ0FDNUJyQixJQUQ0QixFQUU1QmpELE9BRjRCLEVBR2I7QUFDZixXQUFPaUQsSUFBSSxDQUFDNUUsT0FBTCxDQUFhMEYsUUFBcEIsRUFBOEI7QUFDNUJkLE1BQUFBLElBQUksR0FBRyxNQUFNLEtBQUtkLEdBQUwsQ0FBU2MsSUFBSSxDQUFDNUUsT0FBTCxDQUFhMEYsUUFBdEIsRUFBMEMvRCxPQUExQyxDQUFiO0FBQ0Q7O0FBQ0QsV0FBT2lELElBQVA7QUFDRDs7QUEzYm9DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgaHR0cCBmcm9tICdodHRwJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBmcyBmcm9tICdmcyc7XG5pbXBvcnQgKiBhcyBzdHJlYW0gZnJvbSAnc3RyZWFtJztcbmltcG9ydCBpY29udiBmcm9tICdpY29udi1saXRlJztcbmltcG9ydCB7IEZvcm1EYXRhIH0gZnJvbSAnZm9ybWRhdGEtbm9kZSc7XG5pbXBvcnQgeyBVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgcmVxdWVzdCBhcyBIVFRQUmVxdWVzdCwgUmVxdWVzdE9wdGlvbnMgfSBmcm9tICdodHRwcyc7XG5pbXBvcnQgeyBjcmVhdGVCcm90bGlEZWNvbXByZXNzLCBjcmVhdGVHdW56aXAsIGNyZWF0ZUluZmxhdGUgfSBmcm9tICd6bGliJztcbmltcG9ydCB7IHN0cmluZ2lmeSB9IGZyb20gJ3F1ZXJ5c3RyaW5nJztcbmltcG9ydCB7IEhUVFBNZXRob2QgfSBmcm9tICcuLi9zaWdhYS10eXBlcyc7XG5pbXBvcnQgeyBIVFRQU2Vzc2lvbiB9IGZyb20gJy4vc2lnYWEtaHR0cC1zZXNzaW9uJztcbmltcG9ydCB7IFBhZ2UgfSBmcm9tICcuL3NpZ2FhLXBhZ2UnO1xuaW1wb3J0IHsgU2lnYWFQYWdlSW5zdGl0dXRpb25NYXAgfSBmcm9tICcuL3NpZ2FhLWluc3RpdHV0aW9uLWNvbnRyb2xsZXInO1xuaW1wb3J0IHsgU2lnYWFQYWdlSUZTQyB9IGZyb20gJy4vcGFnZS9zaWdhYS1wYWdlLWlmc2MnO1xuaW1wb3J0IHsgU2lnYWFQYWdlVUZQQiB9IGZyb20gJy4vcGFnZS9zaWdhYS1wYWdlLXVmcGInO1xuaW1wb3J0IHsgU2lnYWFQYWdlVU5CIH0gZnJvbSAnLi9wYWdlL3NpZ2FhLXBhZ2UtdW5iJztcblxuLyoqXG4gKiBAY2F0ZWdvcnkgUHVibGljXG4gKi9cbmV4cG9ydCB0eXBlIFByb2dyZXNzQ2FsbGJhY2sgPSAoXG4gIHRvdGFsU2l6ZTogbnVtYmVyLFxuICBkb3dubG9hZGVkU2l6ZT86IG51bWJlclxuKSA9PiB2b2lkO1xuXG4vKipcbiAqIEBjYXRlZ29yeSBJbnRlcm5hbFxuICovXG5leHBvcnQgaW50ZXJmYWNlIFNpZ2FhUmVxdWVzdE9wdGlvbnMge1xuICBtb2JpbGU/OiBib29sZWFuO1xuICBub0NhY2hlPzogYm9vbGVhbjtcbiAgc2hhcmVTYW1lUmVxdWVzdD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogQGNhdGVnb3J5IEludGVybmFsXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSFRUUFJlcXVlc3RPcHRpb25zIGV4dGVuZHMgUmVxdWVzdE9wdGlvbnMge1xuICBob3N0bmFtZTogc3RyaW5nO1xuICBtZXRob2Q6IEhUVFBNZXRob2Q7XG4gIGhlYWRlcnM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbi8qKlxuICogQGNhdGVnb3J5IEludGVybmFsXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSFRUUFJlc3BvbnNlIHtcbiAgYm9keVN0cmVhbTogTm9kZUpTLlJlYWRhYmxlU3RyZWFtO1xuICBoZWFkZXJzOiBodHRwLkluY29taW5nSHR0cEhlYWRlcnM7XG4gIHN0YXR1c0NvZGU6IG51bWJlcjtcbn1cblxuLyoqXG4gKiBAY2F0ZWdvcnkgSW50ZXJuYWxcbiAqIEBpbnN0YW5jZVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEhUVFAge1xuICAvKipcbiAgICogTWFrZSBhIFBPU1QgbXVsdGlwYXJ0IHJlcXVlc3RcbiAgICogQHBhcmFtIHBhdGggVGhlIHBhdGggb2YgcmVxdWVzdCBvciBmdWxsIFVSTFxuICAgKiBAcGFyYW0gZm9ybURhdGEgaW5zdGFuY2Ugb2YgRm9ybURhdGFcbiAgICovXG4gIHBvc3RNdWx0aXBhcnQoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZvcm1EYXRhOiBGb3JtRGF0YSxcbiAgICBvcHRpb25zPzogU2lnYWFSZXF1ZXN0T3B0aW9uc1xuICApOiBQcm9taXNlPFBhZ2U+O1xuXG4gIC8qKlxuICAgKiBNYWtlIGEgUE9TVCByZXF1ZXN0XG4gICAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIG9mIHJlcXVlc3Qgb3IgZnVsbCBVUkxcbiAgICogQHBhcmFtIHBvc3RWYWx1ZXMgUG9zdCB2YWx1ZXMgaW4gZm9ybWF0LCBrZXkgYXMgZmllbGQgbmFtZSwgYW5kIHZhbHVlIGFzIGZpZWxkIHZhbHVlLlxuICAgKiBAcGFyYW0gW29wdGlvbnNdXG4gICAqIEBwYXJhbSBbb3B0aW9ucy5tb2JpbGVdIFVzZSBtb2JpbGUgVXNlci1BZ2VudFxuICAgKiBAcGFyYW0gW29wdGlvbnMubm9DYWNoZV0gSWYgY2FuIHJldHJpZXZlIGZyb20gY2FjaGVcbiAgICovXG4gIHBvc3QoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIHBvc3RWYWx1ZXM6IFJlY29yZDxzdHJpbmcsIHN0cmluZz4sXG4gICAgb3B0aW9ucz86IFNpZ2FhUmVxdWVzdE9wdGlvbnNcbiAgKTogUHJvbWlzZTxQYWdlPjtcblxuICAvKipcbiAgICogTWFrZSBhIEdFVCByZXF1ZXN0XG4gICAqIEBwYXJhbSBwYXRoIFRoZSBwYXRoIG9mIHJlcXVlc3Qgb3IgZnVsbCBVUkxcbiAgICogQHBhcmFtIFtvcHRpb25zXVxuICAgKiBAcGFyYW0gW29wdGlvbnMubm9DYWNoZV0gSWYgY2FuIHJldHJpZXZlIGZyb20gY2FjaGVcbiAgICogQHBhcmFtIFtvcHRpb25zLm1vYmlsZV0gVXNlIG1vYmlsZSBVc2VyLUFnZW50XG4gICAqL1xuICBnZXQocGF0aDogc3RyaW5nLCBvcHRpb25zPzogU2lnYWFSZXF1ZXN0T3B0aW9ucyk6IFByb21pc2U8UGFnZT47XG5cbiAgLyoqXG4gICAqIERvd25sb2FkIGEgZmlsZVxuICAgKiBAcGFyYW0gdXJsUGF0aCBmaWxlIHVybFxuICAgKiBAcGFyYW0gZGVzdHBhdGggcGF0aCB0byBzYXZlIGZpbGVcbiAgICogQHBhcmFtIGNhbGxiYWNrIGNhbGxiYWNrIHRvIHZpZXcgZG93bmxvYWQgcHJvZ3Jlc3NcbiAgICovXG4gIGRvd25sb2FkRmlsZUJ5R2V0KFxuICAgIHVybFBhdGg6IHN0cmluZyxcbiAgICBkZXN0cGF0aDogc3RyaW5nLFxuICAgIGNhbGxiYWNrPzogUHJvZ3Jlc3NDYWxsYmFja1xuICApOiBQcm9taXNlPHN0cmluZz47XG5cbiAgLyoqXG4gICAqIERvd25sb2FkIGEgZmlsZVxuICAgKiBAcGFyYW0gdXJsUGF0aCBmaWxlIHVybFxuICAgKiBAcGFyYW0gYmFzZXBhdGggcGF0aCB0byBzYXZlIGZpbGVcbiAgICogQHBhcmFtIGNhbGxiYWNrIGNhbGxiYWNrIHRvIHZpZXcgZG93bmxvYWQgcHJvZ3Jlc3NcbiAgICovXG4gIGRvd25sb2FkRmlsZUJ5UG9zdChcbiAgICB1cmxQYXRoOiBzdHJpbmcsXG4gICAgcG9zdFZhbHVlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgICBiYXNlcGF0aDogc3RyaW5nLFxuICAgIGNhbGxiYWNrPzogUHJvZ3Jlc3NDYWxsYmFja1xuICApOiBQcm9taXNlPHN0cmluZz47XG5cbiAgLyoqXG4gICAqIEZvbGxvdyB0aGUgcmVkaXJlY3Qgd2hpbGUgdGhlIHBhZ2UgcmVzcG9uc2UgcmVkaXJlY3RzIHRvIGFub3RoZXIgcGFnZVxuICAgKiBAcGFyYW0gcGFnZVxuICAgKiBAcmV0dXJucyBUaGUgbGFzdCBwYWdlIG9mIHJlZGlyZWN0c1xuICAgKi9cbiAgZm9sbG93QWxsUmVkaXJlY3QocGFnZTogUGFnZSwgb3B0aW9ucz86IFNpZ2FhUmVxdWVzdE9wdGlvbnMpOiBQcm9taXNlPFBhZ2U+O1xuXG4gIC8qKlxuICAgKiBDbG9zZSBodHRwIHNlc3Npb25cbiAgICovXG4gIGNsb3NlU2Vzc2lvbigpOiB2b2lkO1xufVxuXG4vKipcbiAqIEhUVFAgcmVxdWVzdCBjbGFzc1xuICogQHBhcmFtIHNpZ2FhU2Vzc2lvbiBBIGluc3RhbmNlIG9mIFNpZ2FhU2Vzc2lvblxuICpcbiAqIEBjYXRlZ29yeSBJbnRlcm5hbFxuICovXG5leHBvcnQgY2xhc3MgU2lnYWFIVFRQIGltcGxlbWVudHMgSFRUUCB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaHR0cFNlc3Npb246IEhUVFBTZXNzaW9uKSB7fVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgYXN5bmMgZG93bmxvYWRGaWxlQnlHZXQoXG4gICAgdXJsUGF0aDogc3RyaW5nLFxuICAgIGJhc2VwYXRoOiBzdHJpbmcsXG4gICAgY2FsbGJhY2s/OiBQcm9ncmVzc0NhbGxiYWNrXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgdXJsID0gdGhpcy5odHRwU2Vzc2lvbi5nZXRVUkwodXJsUGF0aCk7XG4gICAgY29uc3QgaHR0cE9wdGlvbnMgPSB0aGlzLmdldFJlcXVlc3RCYXNpY09wdGlvbnMoJ0dFVCcsIHVybCk7XG4gICAgcmV0dXJuIHRoaXMuZG93bmxvYWRGaWxlKHVybCwgYmFzZXBhdGgsIGh0dHBPcHRpb25zLCB1bmRlZmluZWQsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgZG93bmxvYWRGaWxlQnlQb3N0KFxuICAgIHVybFBhdGg6IHN0cmluZyxcbiAgICBwb3N0VmFsdWVzOiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICAgIGJhc2VwYXRoOiBzdHJpbmcsXG4gICAgY2FsbGJhY2s/OiBQcm9ncmVzc0NhbGxiYWNrXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgdXJsID0gdGhpcy5odHRwU2Vzc2lvbi5nZXRVUkwodXJsUGF0aCk7XG4gICAgY29uc3QgeyBodHRwT3B0aW9ucywgYm9keSB9ID0gdGhpcy5lbmNvZGVQb3N0VmFsdWUodXJsLCBwb3N0VmFsdWVzKTtcbiAgICByZXR1cm4gdGhpcy5kb3dubG9hZEZpbGUodXJsLCBiYXNlcGF0aCwgaHR0cE9wdGlvbnMsIGJvZHksIGNhbGxiYWNrKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBkb3dubG9hZEZpbGUoXG4gICAgdXJsOiBVUkwsXG4gICAgYmFzZXBhdGg6IHN0cmluZyxcbiAgICBodHRwT3B0aW9uczogSFRUUFJlcXVlc3RPcHRpb25zLFxuICAgIGJvZHk/OiBzdHJpbmcsXG4gICAgY2FsbGJhY2s/OiBQcm9ncmVzc0NhbGxiYWNrXG4gICk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2Vzc2lvbkh0dHBPcHRpb25zID0gYXdhaXQgdGhpcy5odHRwU2Vzc2lvbi5hZnRlckhUVFBPcHRpb25zKFxuICAgICAgdXJsLFxuICAgICAgaHR0cE9wdGlvbnNcbiAgICApO1xuXG4gICAgY29uc3QgZmlsZVN0YXRzID0gYXdhaXQgZnMucHJvbWlzZXMubHN0YXQoYmFzZXBhdGgpO1xuICAgIGlmICghKGZpbGVTdGF0cy5pc0RpcmVjdG9yeSgpIHx8IGZpbGVTdGF0cy5pc0ZpbGUoKSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IERvd25sb2FkIGJhc2VwYXRoIG5vdCBleGlzdHMuJyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc3VzcGVuZFJlcXVlc3QgPSBhd2FpdCB0aGlzLmh0dHBTZXNzaW9uLmJlZm9yZURvd25sb2FkUmVxdWVzdChcbiAgICAgIHVybCxcbiAgICAgIGJhc2VwYXRoLFxuICAgICAgc2Vzc2lvbkh0dHBPcHRpb25zLFxuICAgICAgYm9keSxcbiAgICAgIGNhbGxiYWNrXG4gICAgKTtcbiAgICBpZiAoc3VzcGVuZFJlcXVlc3QpIHJldHVybiBzdXNwZW5kUmVxdWVzdDtcblxuICAgIGNvbnN0IHsgYm9keVN0cmVhbSwgaGVhZGVycywgc3RhdHVzQ29kZSB9ID0gYXdhaXQgdGhpcy5yZXF1ZXN0SFRUUChcbiAgICAgIGh0dHBPcHRpb25zLFxuICAgICAgYm9keVxuICAgICk7XG5cbiAgICBpZiAoc3RhdHVzQ29kZSA9PT0gMzAyKSB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBEb3dubG9hZCBleHBpcmVkLicpO1xuXG4gICAgaWYgKHN0YXR1c0NvZGUgIT09IDIwMClcbiAgICAgIHRocm93IG5ldyBFcnJvcignU0lHQUE6IEludmFsaWQgc3RhdHVzIGNvZGUgYXQgZG93bmxvYWQgZmlsZSBwYWdlLicpO1xuXG4gICAgbGV0IGZpbGVwYXRoOiBzdHJpbmc7XG4gICAgaWYgKGZpbGVTdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICBpZiAoaGVhZGVyc1snY29udGVudC1kaXNwb3NpdGlvbiddKSB7XG4gICAgICAgIGNvbnN0IGZpbGVuYW1lID0gaGVhZGVyc1snY29udGVudC1kaXNwb3NpdGlvbiddXG4gICAgICAgICAgLnJlcGxhY2UoLyhbXFxTXFxzXSo/KWZpbGVuYW1lPVwiL2dtLCAnJylcbiAgICAgICAgICAuc2xpY2UoMCwgLTEpO1xuICAgICAgICBmaWxlcGF0aCA9IHBhdGguam9pbihiYXNlcGF0aCwgZmlsZW5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTSUdBQTogSW52YWxpZCByZXNwb25zZSBhdCBkb3dubG9hZCBmaWxlIHBhZ2UuJyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGZpbGVwYXRoID0gYmFzZXBhdGg7XG4gICAgfVxuXG4gICAgY29uc3QgZmlsZSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbGVwYXRoKTtcbiAgICBib2R5U3RyZWFtLnBpcGUoZmlsZSk7IC8vIHNhdmUgdG8gZmlsZVxuXG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICBib2R5U3RyZWFtLm9uKCdkYXRhJywgKCkgPT4ge1xuICAgICAgICBjYWxsYmFjayhmaWxlLmJ5dGVzV3JpdHRlbik7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBmaW5hbFBhdGggPSBhd2FpdCBuZXcgUHJvbWlzZTxzdHJpbmc+KChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGZpbGUub24oJ2ZpbmlzaCcsICgpID0+IHtcbiAgICAgICAgZmlsZS5jbG9zZSgpOyAvLyBjbG9zZSgpIGlzIHN5bmMsIGNhbGwgcmVzb2x2ZSBhZnRlciBjbG9zZSBjb21wbGV0ZXMuXG4gICAgICAgIHJlc29sdmUoZmlsZXBhdGgpO1xuICAgICAgfSk7XG5cbiAgICAgIGJvZHlTdHJlYW0ub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICBmaWxlLmNsb3NlKCk7XG4gICAgICAgIGZzLnByb21pc2VzLnVubGluayhmaWxlcGF0aCk7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfSk7XG5cbiAgICAgIGZpbGUub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICBmaWxlLmNsb3NlKCk7XG4gICAgICAgIGZzLnVubGlua1N5bmMoZmlsZXBhdGgpO1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB0aGlzLmh0dHBTZXNzaW9uLmFmdGVyRG93bmxvYWRSZXF1ZXN0KFxuICAgICAgdXJsLFxuICAgICAgYmFzZXBhdGgsXG4gICAgICBzZXNzaW9uSHR0cE9wdGlvbnMsXG4gICAgICBmaW5hbFBhdGgsXG4gICAgICBib2R5LFxuICAgICAgY2FsbGJhY2tcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0ZG9jXG4gICAqL1xuICBjbG9zZVNlc3Npb24oKTogdm9pZCB7XG4gICAgdGhpcy5odHRwU2Vzc2lvbi5jbG9zZSgpO1xuICB9XG4gIC8qKlxuICAgKiBDcmVhdGUgb2JqZWN0IE9wdGlvbnMgZm9yIGh0dHBzLnJlcXVlc3RcbiAgICogQHBhcmFtIG1ldGhvZCBIVFRQIG1ldGhvZCBQT1NUIG9yIEdFVFxuICAgKiBAcGFyYW0gbGluayBVUkwgb2YgUmVxdWVzdFxuICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgKiBAcGFyYW0gW29wdGlvbnMud2l0aG91dENvb2tpZXM9dHJ1ZV0gRGlzYWJsZSBjb29raWVzIGluIGhlYWRlcnMsIGRlZmF1bHQgPSB0cnVlXG4gICAqIEBwYXJhbSBbb3B0aW9ucy5tb2JpbGU9ZmFsc2VdIFVzZSBtb2JpbGUgVXNlci1BZ2VudFxuICAgKiBAcmV0dXJucyBUaGUgYmFzaWMgb3B0aW9ucyBmb3IgcmVxdWVzdFxuICAgKi9cbiAgcHJpdmF0ZSBnZXRSZXF1ZXN0QmFzaWNPcHRpb25zKFxuICAgIG1ldGhvZDogSFRUUE1ldGhvZCxcbiAgICBsaW5rOiBVUkwsXG4gICAgYWRkaXRpb25hbEhlYWRlcnM/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+LFxuICAgIG9wdGlvbnM6IFNpZ2FhUmVxdWVzdE9wdGlvbnMgPSB7XG4gICAgICBtb2JpbGU6IGZhbHNlXG4gICAgfVxuICApOiBIVFRQUmVxdWVzdE9wdGlvbnMge1xuICAgIGNvbnN0IGJhc2ljT3B0aW9uczogSFRUUFJlcXVlc3RPcHRpb25zID0ge1xuICAgICAgaG9zdG5hbWU6IGxpbmsuaG9zdG5hbWUsXG4gICAgICBwb3J0OiA0NDMsXG4gICAgICBwYXRoOiBsaW5rLnBhdGhuYW1lICsgbGluay5zZWFyY2gsXG4gICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiBgU0lHQUEtQXBpLzEuMCAoJHtcbiAgICAgICAgICBvcHRpb25zLm1vYmlsZSA/ICdBbmRyb2lkIDcuMDsgJyA6ICcnXG4gICAgICAgIH1odHRwczovL2dpdGh1Yi5jb20vR2VvdmFuZVNjaG1pdHovc2lnYWEtYXBpKWAsXG4gICAgICAgICdBY2NlcHQtRW5jb2RpbmcnOiAnYnIsIGd6aXAsIGRlZmxhdGUnLFxuICAgICAgICBBY2NlcHQ6ICcqLyonLFxuICAgICAgICAnQ2FjaGUtQ29udHJvbCc6ICdtYXgtYWdlPTAnLFxuICAgICAgICBETlQ6ICcxJyxcbiAgICAgICAgLi4uYWRkaXRpb25hbEhlYWRlcnNcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIGJhc2ljT3B0aW9ucztcbiAgfVxuXG4gIC8qKlxuICAgKiBAaW5oZXJpdGRvY1xuICAgKi9cbiAgcHVibGljIGFzeW5jIHBvc3RNdWx0aXBhcnQoXG4gICAgcGF0aDogc3RyaW5nLFxuICAgIGZvcm1EYXRhOiBGb3JtRGF0YSxcbiAgICBvcHRpb25zPzogU2lnYWFSZXF1ZXN0T3B0aW9uc1xuICApOiBQcm9taXNlPFBhZ2U+IHtcbiAgICBjb25zdCB1cmwgPSB0aGlzLmh0dHBTZXNzaW9uLmdldFVSTChwYXRoKTtcbiAgICBjb25zdCBodHRwT3B0aW9ucyA9IHRoaXMuZ2V0UmVxdWVzdEJhc2ljT3B0aW9ucyhcbiAgICAgICdQT1NUJyxcbiAgICAgIHVybCxcbiAgICAgIGZvcm1EYXRhLmhlYWRlcnMsXG4gICAgICBvcHRpb25zXG4gICAgKTtcblxuICAgIGNvbnN0IGJ1ZmZlciA9IGF3YWl0IHRoaXMuY29udmVydFJlYWRlYmxlVG9CdWZmZXIoZm9ybURhdGEuc3RyZWFtKTtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0UGFnZSh1cmwsIGh0dHBPcHRpb25zLCBidWZmZXIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnZlcnQgc3RyZWFtLlJlYWRhYmxlIHRvIGJ1ZmZlclxuICAgKiBAcGFyYW0gc3RyZWFtIHJlYWRhYmxlIHN0cmVhbVxuICAgKi9cbiAgcHJpdmF0ZSBjb252ZXJ0UmVhZGVibGVUb0J1ZmZlcihcbiAgICBzdHJlYW06IE5vZGVKUy5SZWFkYWJsZVN0cmVhbVxuICApOiBQcm9taXNlPEJ1ZmZlcj4ge1xuICAgIGNvbnN0IGJ1ZmZlcnM6IFVpbnQ4QXJyYXlbXSA9IFtdO1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBzdHJlYW0ub24oJ2RhdGEnLCAoZGF0YTogVWludDhBcnJheSB8IHN0cmluZykgPT4ge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgYnVmZmVycy5wdXNoKEJ1ZmZlci5mcm9tKGRhdGEpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBidWZmZXJzLnB1c2goZGF0YSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBzdHJlYW0ub24oJ2Nsb3NlJywgKCkgPT4ge1xuICAgICAgICBjb25zdCBidWZmZXIgPSBCdWZmZXIuY29uY2F0KGJ1ZmZlcnMpO1xuICAgICAgICByZXNvbHZlKGJ1ZmZlcik7XG4gICAgICB9KTtcblxuICAgICAgc3RyZWFtLm9uKCdlcnJvcicsIChlcnIpID0+IHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSRkMgMzk4NlxuICAgKiBVc2VzIHRoZSBVVEYtOCBjb2RlIHBvaW50IHRvIGNvZGUsIG5vdCB0aGUgaGV4YWRlY2ltYWwgYmluYXJ5XG4gICAqIEBwYXJhbSBzdHJcbiAgICovXG4gIHByaXZhdGUgZW5jb2RlV2l0aFJGQzM5ODYoc3RyOiBzdHJpbmcpOiBzdHJpbmcge1xuICAgIGxldCBlc2NhcGVkU3RyaW5nID0gJyc7XG4gICAgY29uc3QgdW5yZXNlcnZlZENoYXJhY3RlcnMgPVxuICAgICAgJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5LV8ufic7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh1bnJlc2VydmVkQ2hhcmFjdGVycy5pbmNsdWRlcyhzdHIuY2hhckF0KGkpKSkge1xuICAgICAgICBlc2NhcGVkU3RyaW5nICs9IHN0ci5jaGFyQXQoaSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjb2RlUG9pbnQgPSBzdHIuY29kZVBvaW50QXQoaSk7XG4gICAgICAgIGlmIChjb2RlUG9pbnQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NJR0FBOiBJbnZhbGlkIGNvZGUgcG9pbnQuJyk7XG4gICAgICAgIGNvZGVQb2ludC50b1N0cmluZygxNikucmVwbGFjZSgvLi4/L2csICclJCYnKTtcbiAgICAgICAgZXNjYXBlZFN0cmluZyArPSBjb2RlUG9pbnQudG9TdHJpbmcoMTYpLnJlcGxhY2UoLy4uPy9nLCAnJSQmJyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBlc2NhcGVkU3RyaW5nO1xuICB9XG5cbiAgLyoqXG4gICAqIEBpbmhlcml0ZG9jXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgcG9zdChcbiAgICBwYXRoOiBzdHJpbmcsXG4gICAgcG9zdFZhbHVlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgICBvcHRpb25zOiBTaWdhYVJlcXVlc3RPcHRpb25zID0ge31cbiAgKTogUHJvbWlzZTxQYWdlPiB7XG4gICAgY29uc3QgdXJsID0gdGhpcy5odHRwU2Vzc2lvbi5nZXRVUkwocGF0aCk7XG5cbiAgICBjb25zdCB7IGh0dHBPcHRpb25zLCBib2R5IH0gPSB0aGlzLmVuY29kZVBvc3RWYWx1ZShcbiAgICAgIHVybCxcbiAgICAgIHBvc3RWYWx1ZXMsXG4gICAgICBvcHRpb25zXG4gICAgKTtcbiAgICByZXR1cm4gdGhpcy5yZXF1ZXN0UGFnZSh1cmwsIGh0dHBPcHRpb25zLCBib2R5LCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBib2R5IGFuZCBoZWFkZXJzIGZvciBwb3N0IHJlcXVlc3RcbiAgICogQHBhcmFtIHBvc3RWYWx1ZXNcbiAgICogQHBhcmFtIHVybFxuICAgKiBAcGFyYW0gb3B0aW9uc1xuICAgKi9cbiAgcHJpdmF0ZSBlbmNvZGVQb3N0VmFsdWUoXG4gICAgdXJsOiBVUkwsXG4gICAgcG9zdFZhbHVlczogUmVjb3JkPHN0cmluZywgc3RyaW5nPixcbiAgICBvcHRpb25zPzogU2lnYWFSZXF1ZXN0T3B0aW9uc1xuICApIHtcbiAgICBjb25zdCBib2R5ID0gc3RyaW5naWZ5KHBvc3RWYWx1ZXMsICcmJywgJz0nLCB7XG4gICAgICBlbmNvZGVVUklDb21wb25lbnQ6IHRoaXMuZW5jb2RlV2l0aFJGQzM5ODZcbiAgICB9KTtcblxuICAgIGNvbnN0IGh0dHBPcHRpb25zID0gdGhpcy5nZXRSZXF1ZXN0QmFzaWNPcHRpb25zKFxuICAgICAgJ1BPU1QnLFxuICAgICAgdXJsLFxuICAgICAge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcsXG4gICAgICAgICdDb250ZW50LUxlbmd0aCc6IEJ1ZmZlci5ieXRlTGVuZ3RoKGJvZHkpLnRvU3RyaW5nKDEwKVxuICAgICAgfSxcbiAgICAgIG9wdGlvbnNcbiAgICApO1xuICAgIHJldHVybiB7IGh0dHBPcHRpb25zLCBib2R5IH07XG4gIH1cblxuICBwdWJsaWMgYXN5bmMgZ2V0KHBhdGg6IHN0cmluZywgb3B0aW9ucz86IFNpZ2FhUmVxdWVzdE9wdGlvbnMpOiBQcm9taXNlPFBhZ2U+IHtcbiAgICBjb25zdCB1cmwgPSB0aGlzLmh0dHBTZXNzaW9uLmdldFVSTChwYXRoKTtcbiAgICBjb25zdCBodHRwT3B0aW9ucyA9IHRoaXMuZ2V0UmVxdWVzdEJhc2ljT3B0aW9ucyhcbiAgICAgICdHRVQnLFxuICAgICAgdXJsLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgb3B0aW9uc1xuICAgICk7XG4gICAgcmV0dXJuIHRoaXMucmVxdWVzdFBhZ2UodXJsLCBodHRwT3B0aW9ucywgdW5kZWZpbmVkLCBvcHRpb25zKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlIGEgSFRUUCByZXF1ZXN0IGZvciBhIHBhZ2VcbiAgICogQHBhcmFtIHVybCB1cmwgb2YgcmVxdWVzdFxuICAgKiBAcGFyYW0gb3B0aW9ucyBodHRwLnJlcXVlc3Qgb3B0aW9uc1xuICAgKiBAcGFyYW0gW3JlcXVlc3RCb2R5XSBib2R5IG9mIHJlcXVlc3RcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgcmVxdWVzdFBhZ2UoXG4gICAgdXJsOiBVUkwsXG4gICAgaHR0cE9wdGlvbnM6IEhUVFBSZXF1ZXN0T3B0aW9ucyxcbiAgICByZXF1ZXN0Qm9keT86IHN0cmluZyB8IEJ1ZmZlcixcbiAgICBvcHRpb25zPzogU2lnYWFSZXF1ZXN0T3B0aW9uc1xuICApOiBQcm9taXNlPFBhZ2U+IHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgc2Vzc2lvbkh0dHBPcHRpb25zID0gYXdhaXQgdGhpcy5odHRwU2Vzc2lvbi5hZnRlckhUVFBPcHRpb25zKFxuICAgICAgICB1cmwsXG4gICAgICAgIGh0dHBPcHRpb25zLFxuICAgICAgICByZXF1ZXN0Qm9keSxcbiAgICAgICAgb3B0aW9uc1xuICAgICAgKTtcbiAgICAgIGNvbnN0IHBhZ2VCZWZvcmVSZXF1ZXN0ID0gYXdhaXQgdGhpcy5odHRwU2Vzc2lvbi5iZWZvcmVSZXF1ZXN0KFxuICAgICAgICB1cmwsXG4gICAgICAgIHNlc3Npb25IdHRwT3B0aW9ucyxcbiAgICAgICAgcmVxdWVzdEJvZHksXG4gICAgICAgIG9wdGlvbnNcbiAgICAgICk7XG4gICAgICBpZiAocGFnZUJlZm9yZVJlcXVlc3QpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuaHR0cFNlc3Npb24uYWZ0ZXJTdWNjZXNzZnVsUmVxdWVzdChcbiAgICAgICAgICBwYWdlQmVmb3JlUmVxdWVzdCxcbiAgICAgICAgICBvcHRpb25zXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHsgYm9keVN0cmVhbSwgaGVhZGVycywgc3RhdHVzQ29kZSB9ID0gYXdhaXQgdGhpcy5yZXF1ZXN0SFRUUChcbiAgICAgICAgaHR0cE9wdGlvbnMsXG4gICAgICAgIHJlcXVlc3RCb2R5XG4gICAgICApO1xuXG4gICAgICBjb25zdCBib2R5QnVmZmVyID0gYXdhaXQgdGhpcy5jb252ZXJ0UmVhZGVibGVUb0J1ZmZlcihib2R5U3RyZWFtKTtcbiAgICAgIGNvbnN0IFNpZ2FhUGFnZUluc3RpdHV0aW9uOiBTaWdhYVBhZ2VJbnN0aXR1dGlvbk1hcCA9IHtcbiAgICAgICAgSUZTQzogU2lnYWFQYWdlSUZTQyxcbiAgICAgICAgVUZQQjogU2lnYWFQYWdlVUZQQixcbiAgICAgICAgVU5COiBTaWdhYVBhZ2VVTkIsXG4gICAgICAgIFVGUlBFOiBTaWdhYVBhZ2VVTkJcbiAgICAgIH07XG4gICAgICBjb25zdCBwYWdlID0gbmV3IFNpZ2FhUGFnZUluc3RpdHV0aW9uW1xuICAgICAgICB0aGlzLmh0dHBTZXNzaW9uLmluc3RpdHV0aW9uQ29udHJvbGxlci5pbnN0aXR1dGlvblxuICAgICAgXSh7XG4gICAgICAgIHJlcXVlc3RPcHRpb25zOiBodHRwT3B0aW9ucyxcbiAgICAgICAgYm9keTogYm9keUJ1ZmZlci50b1N0cmluZygpLFxuICAgICAgICB1cmwsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHN0YXR1c0NvZGUsXG4gICAgICAgIHJlcXVlc3RCb2R5XG4gICAgICB9KTtcbiAgICAgIHJldHVybiB0aGlzLmh0dHBTZXNzaW9uLmFmdGVyU3VjY2Vzc2Z1bFJlcXVlc3QocGFnZSwgb3B0aW9ucyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gdGhpcy5odHRwU2Vzc2lvbi5hZnRlclVuc3VjY2Vzc2Z1bFJlcXVlc3QoXG4gICAgICAgIGVycixcbiAgICAgICAgaHR0cE9wdGlvbnMsXG4gICAgICAgIHJlcXVlc3RCb2R5XG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBNYWtlIGEgSFRUUCByZXF1ZXN0XG4gICAqIEBwYXJhbSBvcHRpb25zSFRUUCBodHRwLnJlcXVlc3Qgb3B0aW9uc1xuICAgKiBAcGFyYW0gW2JvZHldIGJvZHkgb2YgcmVxdWVzdFxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHJlcXVlc3RIVFRQKFxuICAgIG9wdGlvbnNIVFRQOiBIVFRQUmVxdWVzdE9wdGlvbnMsXG4gICAgYm9keT86IHN0cmluZyB8IEJ1ZmZlclxuICApOiBQcm9taXNlPEhUVFBSZXNwb25zZT4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjb25zdCByZXEgPSBIVFRQUmVxdWVzdChvcHRpb25zSFRUUCwgKHJlc3BvbnNlKSA9PiB7XG4gICAgICAgIHJlc29sdmUodGhpcy5wYXJzZXJSZXNwb25zZShyZXNwb25zZSkpO1xuICAgICAgfSk7XG5cbiAgICAgIHJlcS5vbignZXJyb3InLCAoZXJyKSA9PiB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfSk7XG5cbiAgICAgIGlmIChib2R5KSByZXEud3JpdGUoYm9keSk7XG4gICAgICByZXEuZW5kKCk7XG4gICAgfSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgcGFyc2VyUmVzcG9uc2UoXG4gICAgcmVzcG9uc2U6IGh0dHAuSW5jb21pbmdNZXNzYWdlXG4gICk6IFByb21pc2U8SFRUUFJlc3BvbnNlPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGxldCBzdHJlYW1EZWNvbXByZXNzZWQ6IHN0cmVhbS5UcmFuc2Zvcm0gfCB1bmRlZmluZWQgPSB1bmRlZmluZWQ7XG4gICAgICBzd2l0Y2ggKHJlc3BvbnNlLmhlYWRlcnNbJ2NvbnRlbnQtZW5jb2RpbmcnXSkge1xuICAgICAgICBjYXNlICdicic6XG4gICAgICAgICAgc3RyZWFtRGVjb21wcmVzc2VkID0gY3JlYXRlQnJvdGxpRGVjb21wcmVzcygpO1xuICAgICAgICAgIHJlc3BvbnNlLnBpcGUoc3RyZWFtRGVjb21wcmVzc2VkKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnZ3ppcCc6XG4gICAgICAgICAgc3RyZWFtRGVjb21wcmVzc2VkID0gY3JlYXRlR3VuemlwKCk7XG4gICAgICAgICAgcmVzcG9uc2UucGlwZShzdHJlYW1EZWNvbXByZXNzZWQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdkZWZsYXRlJzpcbiAgICAgICAgICBzdHJlYW1EZWNvbXByZXNzZWQgPSBjcmVhdGVJbmZsYXRlKCk7XG4gICAgICAgICAgcmVzcG9uc2UucGlwZShzdHJlYW1EZWNvbXByZXNzZWQpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgcmVzcG9uc2Uub24oJ2Vycm9yJywgKGVycikgPT4ge1xuICAgICAgICBpZiAoc3RyZWFtRGVjb21wcmVzc2VkKSB7XG4gICAgICAgICAgc3RyZWFtRGVjb21wcmVzc2VkLmVuZCgpO1xuICAgICAgICB9XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfSk7XG4gICAgICByZXNwb25zZS5vbignY2xvc2UnLCAoKSA9PiB7XG4gICAgICAgIGlmIChzdHJlYW1EZWNvbXByZXNzZWQpIHtcbiAgICAgICAgICBzdHJlYW1EZWNvbXByZXNzZWQuZW5kKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKEFycmF5LmlzQXJyYXkocmVzcG9uc2UuaGVhZGVycy5sb2NhdGlvbikpIHtcbiAgICAgICAgcmVzcG9uc2UuaGVhZGVycy5sb2NhdGlvbiA9IHJlc3BvbnNlLmhlYWRlcnMubG9jYXRpb25bMF07XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNvbnRlbnRUeXBlRW5jb2RpbmcgPVxuICAgICAgICByZXNwb25zZS5oZWFkZXJzWydjb250ZW50LXR5cGUnXT8ubWF0Y2goL2NoYXJzZXQ9W147XSsvKTtcblxuICAgICAgbGV0IGJvZHlTdHJlYW06XG4gICAgICAgIHwgaHR0cC5JbmNvbWluZ01lc3NhZ2VcbiAgICAgICAgfCBzdHJlYW0uVHJhbnNmb3JtXG4gICAgICAgIHwgTm9kZUpTLlJlYWRXcml0ZVN0cmVhbSA9IHN0cmVhbURlY29tcHJlc3NlZCB8fCByZXNwb25zZTtcblxuICAgICAgbGV0IGljb252U3RyZWFtOiBOb2RlSlMuUmVhZFdyaXRlU3RyZWFtIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xuICAgICAgaWYgKGNvbnRlbnRUeXBlRW5jb2RpbmcpIHtcbiAgICAgICAgY29uc3QgZW5jb2RpbmcgPSBjb250ZW50VHlwZUVuY29kaW5nWzBdLnJlcGxhY2UoL15jaGFyc2V0PS8sICcnKTtcblxuICAgICAgICBpY29udlN0cmVhbSA9IGljb252LmRlY29kZVN0cmVhbShlbmNvZGluZyk7XG5cbiAgICAgICAgYm9keVN0cmVhbSA9IGJvZHlTdHJlYW0ucGlwZShpY29udlN0cmVhbSk7XG4gICAgICB9XG4gICAgICByZXNvbHZlKHtcbiAgICAgICAgYm9keVN0cmVhbSxcbiAgICAgICAgaGVhZGVyczogcmVzcG9uc2UuaGVhZGVycyxcbiAgICAgICAgc3RhdHVzQ29kZTogcmVzcG9uc2Uuc3RhdHVzQ29kZSBhcyBudW1iZXJcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGFzeW5jIGZvbGxvd0FsbFJlZGlyZWN0KFxuICAgIHBhZ2U6IFBhZ2UsXG4gICAgb3B0aW9ucz86IFNpZ2FhUmVxdWVzdE9wdGlvbnNcbiAgKTogUHJvbWlzZTxQYWdlPiB7XG4gICAgd2hpbGUgKHBhZ2UuaGVhZGVycy5sb2NhdGlvbikge1xuICAgICAgcGFnZSA9IGF3YWl0IHRoaXMuZ2V0KHBhZ2UuaGVhZGVycy5sb2NhdGlvbiBhcyBzdHJpbmcsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gcGFnZTtcbiAgfVxufVxuIl19