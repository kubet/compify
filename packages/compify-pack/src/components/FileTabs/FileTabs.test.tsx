// Modified by Compify; see packages/compify-pack/PROVENANCE.md.
/**
 * @jest-environment jsdom
 */
import { act } from "@testing-library/react-hooks";
import React from "react";
import { create } from "react-test-renderer";

import { SandpackProvider } from "../../contexts/sandpackContext";
import { SandpackCodeEditor } from "../CodeEditor";

describe("FileTabs", () => {
  jest.useFakeTimers();

  it("doesn't have duplicate filename", () => {
    const component = create(
      <SandpackProvider
        files={{
          "/foo/App.js": "",
          "/App.js": "",
          "/baz/App.js": "",
        }}
        template="react"
      >
        <SandpackCodeEditor />
      </SandpackProvider>
    ).root;

    act(() => {
      jest.runAllTimers();
    });

    const buttons = component.findAll((el) =>
      el.props.className?.includes("sp-tab-button")
    );
    const buttonsTex = buttons.map((item) => item.props.children);

    expect(buttonsTex).toEqual(["foo/App.js", "App.js", "baz/App.js"]);
  });

  it("render the visible files", () => {
    const component = create(
      <SandpackProvider
        files={{
          "/foo/App.js": "",
          "/App.js": "",
          "/baz/App.js": "",
        }}
        options={{
          visibleFiles: ["/baz/App.js", "/App.js"],
        }}
        template="react"
      >
        <SandpackCodeEditor />
      </SandpackProvider>
    ).root;

    act(() => {
      jest.runAllTimers();
    });

    const buttons = component.findAll((el) =>
      el.props.className?.includes("sp-tab-button")
    );
    const buttonsTex = buttons.map((item) => item.props.children);

    expect(buttonsTex).toEqual(["baz/App.js", "App.js"]);
  });

  it("activates the last visible file when End is pressed", () => {
    const component = create(
      <SandpackProvider
        files={{
          "/first.js": "",
          "/middle.js": "",
          "/last.js": "",
        }}
        options={{
          activeFile: "/first.js",
          visibleFiles: ["/first.js", "/middle.js", "/last.js"],
        }}
        template="react"
      >
        <SandpackCodeEditor />
      </SandpackProvider>
    ).root;

    act(() => {
      jest.runAllTimers();
    });

    const tabs = component.findAllByProps({ role: "tab" });
    const focus = jest.fn();

    act(() => {
      tabs[0].props.onKeyDown({
        key: "End",
        currentTarget: {
          parentElement: {
            lastElementChild: {
              querySelector: () => ({ focus }),
            },
          },
        },
      });
    });

    const activeButton = component.findAll((el) =>
      el.props.className?.includes("sp-tab-button") && el.props["data-active"]
    );

    expect(focus).toHaveBeenCalledTimes(1);
    expect(activeButton).toHaveLength(1);
    expect(activeButton[0].props.title).toBe("/last.js");
  });

  it("renders close controls as accessible buttons", () => {
    const component = create(
      <SandpackProvider
        files={{
          "/App.js": "",
          "/index.js": "",
        }}
        options={{ activeFile: "/App.js" }}
        template="react"
      >
        <SandpackCodeEditor closableTabs />
      </SandpackProvider>
    ).root;

    act(() => {
      jest.runAllTimers();
    });

    const closeButton = component.findByProps({
      "aria-label": "Close App.js",
    });

    expect(closeButton.type).toBe("button");
    expect(closeButton.props.type).toBe("button");
    expect(closeButton.props.title).toBe("Close /App.js");
  });
});
