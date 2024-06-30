import React, { Component } from 'react';

const KEYCODE_Y = 89;
const KEYCODE_Z = 90;
const KEYCODE_M = 77;
const KEYCODE_PARENS = 57;
const KEYCODE_BRACKETS = 219;
const KEYCODE_QUOTE = 222;
const KEYCODE_BACK_QUOTE = 192;

const HISTORY_LIMIT = 100;
const HISTORY_TIME_GAP = 3000;

const isWindows =
  typeof window !== 'undefined' &&
  'navigator' in window &&
  /Win/i.test(navigator.platform);
const isMacLike =
  typeof window !== 'undefined' &&
  'navigator' in window &&
  /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);

const className = 'npm__react-simple-code-editor__textarea';

const cssText = `
/**
 * Reset the text fill color so that placeholder is visible
 */
.${className}:empty {
  -webkit-text-fill-color: inherit !important;
}

/**
 * Hack to apply on some CSS on IE10 and IE11
 */
@media all and (-ms-high-contrast: none), (-ms-high-contrast: active) {
  /**
    * IE doesn't support '-webkit-text-fill-color'
    * So we use 'color: transparent' to make the text transparent on IE
    * Unlike other browsers, it doesn't affect caret color in IE
    */
  .${className} {
    color: transparent !important;
  }

  .${className}::selection {
    background-color: #accef7 !important;
    color: transparent !important;
  }
}
`;

class Editor extends Component {
  static defaultProps = {
    tabSize: 2,
    insertSpaces: true,
    ignoreTabKey: false,
    padding: 0,
  };

  state = {
    capture: true,
  };

  componentDidMount() {
    this._recordCurrentState();
  }

  _recordCurrentState = () => {
    const input = this._input;

    if (!input) return;

    // Save current state of the input
    const { value, selectionStart, selectionEnd } = input;

    this._recordChange({
      value,
      selectionStart,
      selectionEnd,
    });
  };

  _getLines = (text, position) =>
    text.substring(0, position).split('\n');

  _recordChange = (record, overwrite = false) => {
    const { stack, offset } = this._history;

    if (stack.length && offset > -1) {
      // When something updates, drop the redo operations
      this._history.stack = stack.slice(0, offset + 1);

      // Limit the number of operations to 100
      const count = this._history.stack.length;

      if (count > HISTORY_LIMIT) {
        const extras = count - HISTORY_LIMIT;

        this._history.stack = stack.slice(extras, count);
        this._history.offset = Math.max(this._history.offset - extras, 0);
      }
    }

    const timestamp = Date.now();

    if (overwrite) {
      const last = this._history.stack[this._history.offset];

      if (last && timestamp - last.timestamp < HISTORY_TIME_GAP) {
        // A previous entry exists and was in short interval

        // Match the last word in the line
        const re = /[^a-z0-9]([a-z0-9]+)$/i;

        // Get the previous line
        const previous = this._getLines(last.value, last.selectionStart)
          .pop()
          ?.match(re);

        // Get the current line
        const current = this._getLines(record.value, record.selectionStart)
          .pop()
          ?.match(re);

        if (previous?.[1] && current?.[1]?.startsWith(previous[1])) {
          // The last word of the previous line and current line match
          // Overwrite previous entry so that undo will remove whole word
          this._history.stack[this._history.offset] = { ...record, timestamp };

          return;
        }
      }
    }

    // Add the new operation to the stack
    this._history.stack.push({ ...record, timestamp });
    this._history.offset++;
  };

  _updateInput = (record) => {
    const input = this._input;

    if (!input) return;

    // Update values and selection state
    input.value = record.value;
    input.selectionStart = record.selectionStart;
    input.selectionEnd = record.selectionEnd;

    this.props.onValueChange(record.value);
  };

  _applyEdits = (record) => {
    // Save last selection state
    const input = this._input;
    const last = this._history.stack[this._history.offset];

    if (last && input) {
      this._history.stack[this._history.offset] = {
        ...last,
        selectionStart: input.selectionStart,
        selectionEnd: input.selectionEnd,
      };
    }

    // Save the changes
    this._recordChange(record);
    this._updateInput(record);
  };

  _undoEdit = () => {
    const { stack, offset } = this._history;

    // Get the previous edit
    const record = stack[offset - 1];

    if (record) {
      // Apply the changes and update the offset
      this._updateInput(record);
      this._history.offset = Math.max(offset - 1, 0);
    }
  };

  _redoEdit = () => {
    const { stack, offset } = this._history;

    // Get the next edit
    const record = stack[offset + 1];

    if (record) {
      // Apply the changes and update the offset
      this._updateInput(record);
      this._history.offset = Math.min(offset + 1, stack.length - 1);
    }
  };

  _handleKeyDown = (e) => {
    const { tabSize, insertSpaces, ignoreTabKey, onKeyDown } = this.props;

    if (onKeyDown) {
      onKeyDown(e);

      if (e.defaultPrevented) {
        return;
      }
    }

    if (e.key === 'Escape') {
      e.currentTarget.blur();
    }

    const { value, selectionStart, selectionEnd } = e.currentTarget;

    const tabCharacter = (insertSpaces ? ' ' : '\t').repeat(tabSize);

    if (e.key === 'Tab' && !ignoreTabKey && this.state.capture) {
      // Prevent focus change
      e.preventDefault();

      if (e.shiftKey) {
        // Unindent selected lines
        const linesBeforeCaret = this._getLines(value, selectionStart);
        const startLine = linesBeforeCaret.length - 1;
        const endLine = this._getLines(value, selectionEnd).length - 1;
        const nextValue = value
          .split('\n')
          .map((line, i) => {
            if (
              i >= startLine &&
              i <= endLine &&
              line.startsWith(tabCharacter)
            ) {
              return line.substring(tabCharacter.length);
            }

            return line;
          })
          .join('\n');

        if (value !== nextValue) {
          const startLineText = linesBeforeCaret[startLine];

          this._applyEdits({
            value: nextValue,
            // Move the start cursor if first line in selection was modified
            // It was modified only if it started with a tab
            selectionStart: startLineText?.startsWith(tabCharacter)
              ? selectionStart - tabCharacter.length
              : selectionStart,
            // Move the end cursor by total number of characters removed
            selectionEnd: selectionEnd - (value.length - nextValue.length),
          });
        }
      } else if (selectionStart !== selectionEnd) {
        // Indent selected lines
        const linesBeforeCaret = this._getLines(value, selectionStart);
        const startLine = linesBeforeCaret.length - 1;
        const endLine = this._getLines(value, selectionEnd).length - 1;
        const startLineText = linesBeforeCaret[startLine];

        this._applyEdits({
          value: value
            .split('\n')
            .map((line, i) => {
              if (i >= startLine && i <= endLine) {
                return tabCharacter + line;
              }

              return line;
            })
            .join('\n'),
          // Move the start cursor by number of characters added in first line of selection
          // Don't move it if it there was no text before cursor
          selectionStart:
            startLineText && /\S/.test(startLineText)
              ? selectionStart + tabCharacter.length
              : selectionStart,
          // Move the end cursor by total number of characters added
          selectionEnd:
            selectionEnd + tabCharacter.length * (endLine - startLine + 1),
        });
      } else {
        const updatedSelection = selectionStart + tabCharacter.length;

        this._applyEdits({
          // Insert tab character at caret
          value:
            value.substring(0, selectionStart) +
            tabCharacter +
            value.substring(selectionEnd),
          // Update caret position
          selectionStart: updatedSelection,
          selectionEnd: updatedSelection,
        });
      }
    } else if (e.key === 'Backspace') {
      const hasSelection = selectionStart !== selectionEnd;
      const textBeforeCaret = value.substring(0, selectionStart);

      if (textBeforeCaret.endsWith(tabCharacter) && !hasSelection) {
        // Prevent default delete behaviour
        e.preventDefault();

        const updatedSelection = selectionStart - tabCharacter.length;

        this._applyEdits({
          // Remove tab character at caret
          value:
            value.substring(0, updatedSelection) +
            value.substring(selectionEnd),
          // Update caret position
          selectionStart: updatedSelection,
          selectionEnd: updatedSelection,
        });
      }
    } else if (
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key === 'PageUp' ||
      e.key === 'PageDown'
    ) {
      // Record the state of the editor before the selection of previous state
      this._recordCurrentState();
    } else if (
      e.ctrlKey === this.state.capture &&
      !e.altKey &&
      !e.metaKey &&
      (e.key === 'y' || e.key === 'z')
    ) {
      // Override default behaviour to undo/redo
      e.preventDefault();

      if (e.key === 'y' && isWindows) {
        // Windows-specific: redo
        this._redoEdit();
      } else if (e.key === 'z') {
        // Undo/redo on all the other OSs
        this._undoEdit();
      }
    } else if (
      e.key === 'Tab' &&
      this.state.capture &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey
    ) {
      // Ignore tab key when not capturing or using alternative keys
      e.preventDefault();
    }
  };

  _handleKeyPress = (e) => {
    const { onKeyPress } = this.props;

    if (onKeyPress) {
      onKeyPress(e);

      if (e.defaultPrevented) {
        return;
      }
    }

    if (
      e.ctrlKey === this.state.capture &&
      !e.altKey &&
      !e.metaKey &&
      (e.keyCode === KEYCODE_PARENS ||
        e.keyCode === KEYCODE_BRACKETS ||
        e.keyCode === KEYCODE_QUOTE ||
        e.keyCode === KEYCODE_BACK_QUOTE)
    ) {
      // Wrap selected text in matching characters
      const { value, selectionStart, selectionEnd } = e.currentTarget;
      const selectedText = value.substring(selectionStart, selectionEnd);
      const surround = String.fromCharCode(e.keyCode);

      e.preventDefault();

      this._applyEdits({
        value:
          value.substring(0, selectionStart) +
          surround +
          selectedText +
          surround +
          value.substring(selectionEnd),
        // Move the caret to the end of the selection
        selectionStart,
        selectionEnd: selectionEnd + 2,
      });
    }
  };

  _handleCompositionStart = () => {
    // When text is being composed, stop recording operations
    this.setState({ capture: false });
  };

  _handleCompositionEnd = () => {
    // When text has been composed, continue recording operations
    this.setState({ capture: true });

    this._recordCurrentState();
  };

  _handleChange = (e) => {
    const { onChange } = this.props;

    if (onChange) {
      onChange(e);

      if (e.defaultPrevented) {
        return;
      }
    }

    // Record changes if input captured and has a pending composition
    if (this.state.capture && !this._compositionCount) {
      this._recordChange({
        value: e.target.value,
        selectionStart: e.target.selectionStart,
        selectionEnd: e.target.selectionEnd,
      });
    }
  };

  render() {
    const {
      padding,
      textareaId,
      textareaClassName,
      style,
      value,
      highlight,
      padding: paddingProp,
      tabSize,
      insertSpaces,
      ignoreTabKey,
      autoFocus,
      disabled,
      form,
      maxLength,
      minLength,
      name,
      placeholder,
      readOnly,
      required,
      onClick,
      onFocus,
      onBlur,
      onKeyUp,
      onKeyDown,
      onKeyPress,
      onChange,
      preClassName,
      ...rest
    } = this.props;

    return (
      <div
        style={{
          ...style,
          padding:
            typeof padding === 'number'
              ? `${padding}px`
              : padding,
        }}
      >
        <style>{cssText}</style>
        <textarea
          id={textareaId}
          className={`${className} ${textareaClassName}`}
          style={{
            width: '100%',
            height: '100%',
            ...style,
          }}
          ref={(c) => {
            this._input = c;
          }}
          value={value}
          placeholder={placeholder}
          readOnly={readOnly}
          onChange={this._handleChange}
          onCompositionStart={this._handleCompositionStart}
          onCompositionEnd={this._handleCompositionEnd}
          onKeyDown={this._handleKeyDown}
          onKeyPress={this._handleKeyPress}
          onClick={onClick}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyUp={onKeyUp}
          maxLength={maxLength}
          minLength={minLength}
          name={name}
          disabled={disabled}
          autoFocus={autoFocus}
          form={form}
          required={required}
          {...rest}
        />
      </div>
    );
  }
}

export default Editor;
