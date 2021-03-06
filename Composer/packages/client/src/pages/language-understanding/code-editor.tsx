// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/* eslint-disable react/display-name */
import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { LuEditor } from '@bfc/code-editor';
import get from 'lodash/get';
import debounce from 'lodash/debounce';
import isEmpty from 'lodash/isEmpty';
import { editor } from '@bfcomposer/monaco-editor/esm/vs/editor/editor.api';
import { luIndexer, combineMessage, isValid, filterTemplateDiagnostics } from '@bfc/indexers';
import { RouteComponentProps } from '@reach/router';
import querystring from 'query-string';

import { StoreContext } from '../../store';
import * as luUtil from '../../utils/luUtil';

const { parse } = luIndexer;

const lspServerPath = '/lu-language-server';

interface CodeEditorProps extends RouteComponentProps<{}> {
  fileId: string;
}

const CodeEditor: React.FC<CodeEditorProps> = props => {
  const { actions, state } = useContext(StoreContext);
  const { luFiles } = state;
  const { fileId } = props;
  const file = luFiles?.find(({ id }) => id === fileId);
  const [diagnostics, setDiagnostics] = useState(get(file, 'diagnostics', []));
  const [httpErrorMsg, setHttpErrorMsg] = useState('');
  const [luEditor, setLuEditor] = useState<editor.IStandaloneCodeEditor | null>(null);

  const search = props.location?.search ?? '';
  const searchSectionName = querystring.parse(search).t;
  const sectionId = Array.isArray(searchSectionName)
    ? searchSectionName[0]
    : typeof searchSectionName === 'string'
    ? searchSectionName
    : undefined;
  const intent = sectionId && file ? file.intents.find(({ Name }) => Name === sectionId) : undefined;

  const hash = props.location?.hash ?? '';
  const hashLine = querystring.parse(hash).L;
  const line = Array.isArray(hashLine) ? +hashLine[0] : typeof hashLine === 'string' ? +hashLine : undefined;

  const inlineMode = !!intent;
  const [content, setContent] = useState(intent?.Body || file?.content);

  useEffect(() => {
    // reset content with file.content initial state
    if (!file || isEmpty(file) || content) return;
    const value = intent ? intent.Body : file.content;
    setContent(value);
  }, [file, sectionId]);

  const errorMsg = useMemo(() => {
    const currentDiagnostics = inlineMode && intent ? filterTemplateDiagnostics(diagnostics, intent) : diagnostics;
    const isInvalid = !isValid(currentDiagnostics);
    return isInvalid ? combineMessage(diagnostics) : httpErrorMsg;
  }, [diagnostics, httpErrorMsg]);

  const editorDidMount = (luEditor: editor.IStandaloneCodeEditor) => {
    setLuEditor(luEditor);
  };

  useEffect(() => {
    if (luEditor && line !== undefined) {
      window.requestAnimationFrame(() => {
        luEditor.revealLine(line);
        luEditor.focus();
        luEditor.setPosition({ lineNumber: line, column: 1 });
      });
    }
  }, [line, luEditor]);

  const updateLuIntent = useMemo(
    () =>
      debounce((Body: string) => {
        if (!file || !intent) return;
        const { Name } = intent;
        const payload = {
          file,
          intentName: Name,
          intent: {
            Name,
            Body,
          },
        };
        actions.updateLuIntent(payload);
      }, 500),
    [file, intent]
  );

  const updateLuFile = useMemo(
    () =>
      debounce((content: string) => {
        if (!file) return;
        const { id } = file;
        const payload = {
          id,
          content,
        };
        actions.updateLuFile(payload);
      }, 500),
    [file]
  );

  const updateDiagnostics = useMemo(
    () =>
      debounce((value: string) => {
        if (!file) return;
        const { id } = file;
        if (inlineMode) {
          if (!intent) return;
          const { Name } = intent;
          const { content } = file;
          try {
            const newContent = luUtil.updateIntent(content, Name, {
              Name,
              Body: value,
            });
            const { diagnostics } = parse(newContent, id);
            setDiagnostics(diagnostics);
          } catch (error) {
            setHttpErrorMsg(error.error);
          }
        } else {
          const { diagnostics } = parse(value, id);
          setDiagnostics(diagnostics);
        }
      }, 1000),
    [file, intent]
  );

  const _onChange = useCallback(
    value => {
      setContent(value);
      updateDiagnostics(value);
      if (!file) return;
      if (inlineMode) {
        updateLuIntent(value);
      } else {
        updateLuFile(value);
      }
    },
    [file, intent]
  );

  const luOption = {
    fileId,
    sectionId: intent?.Name,
  };

  return (
    <LuEditor
      hidePlaceholder={inlineMode}
      editorDidMount={editorDidMount}
      value={content}
      errorMsg={errorMsg}
      luOption={luOption}
      languageServer={{
        path: lspServerPath,
      }}
      onChange={_onChange}
    />
  );
};

export default CodeEditor;
