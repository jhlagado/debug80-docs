---
layout: default
title: "Install And Open A Folder"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 1
---
# Install And Open A Folder

Debug80 runs inside Visual Studio Code. The first job is to install VS Code, add the Debug80 extension and open a folder that will hold your Z80 project.

Open <https://code.visualstudio.com/> and install the current VS Code build for your operating system. Debug80 declares support for VS Code `1.92.0` and later.

## Install Debug80

Open VS Code and choose **Extensions** from the Activity Bar. Search for:

```text
Debug80 IDE for Z80 Development
```

Install the extension published by `jhlagado`. After installation, VS Code may ask you to reload the window. Reloading starts the extension in the current VS Code session.

> **Image placeholder:** VS Code Extensions view showing the Debug80 Marketplace entry, with the extension name, publisher and Install button visible.

Debug80 adds syntax highlighting for `.asm`, `.z80`, `.asmi` and `.lst` files. It also adds a debugger type called `z80` and a Debug80 view in the **Run and Debug** sidebar.

## Find The Debug80 Panel

Open the **Run and Debug** sidebar. The Debug80 panel appears there because the extension contributes a view named **Debug80** to the debug view.

If the panel is hidden, open the Command Palette and run:

```text
Debug80: Open Debug80 View
```

The panel may say that no Debug80 project exists. That is the expected state before you open or create a project folder.

> **Image placeholder:** Run and Debug sidebar with the Debug80 panel visible and no project configured.

> **Image placeholder:** Debug80 panel empty state before a project folder has been opened.

## Read The Empty State

The empty state is not an error. It means VS Code is running Debug80, but Debug80 has not found a project in the current window.

At this point Debug80 can still help you start. The panel can open a folder, add a folder to the current window or initialize a project once a folder is selected.

Treat the panel as the home position for Debug80 work. VS Code has its own Run and Debug controls, but Debug80 adds the project and hardware context that a normal language debugger does not know about.

## Open A Folder

Debug80 works from a folder opened in VS Code. The folder holds your source files and the Debug80 project file that describes how to build and run them.

Open a folder with **File > Open Folder**. A folder opened in VS Code is also called a workspace folder. This book uses "folder" for the ordinary case and "workspace folder" when the VS Code term matters.

The Debug80 panel starts with a **Project** row. That row shows the current folder. In a VS Code window with several folders, the same row lets you choose which folder Debug80 should use.

A Debug80 project is a folder with Debug80 configuration. A folder without that configuration is uninitialized. Debug80 can create the configuration for you, so an empty folder is a valid starting point.

> **Image placeholder:** Debug80 panel with one uninitialized folder selected in the Project row.

## Pick A Folder Deliberately

Open the folder that should own the Z80 project. If your source files live in `/projects/blink`, open `blink`, not the parent `projects` folder.

This matters because Debug80 stores project configuration with the project folder. Opening a parent folder can make the project appear missing, or it can make Debug80 show several folders when you expected one.

For a new project, create an empty folder with a name you can recognize in the Debug80 panel. For an existing project, open the folder that already contains `debug80.json` or `.vscode/debug80.json`.

## Add Another Folder

The `+` button beside the project selector adds another folder to the current VS Code window. Use it when you keep several Z80 projects open together.

In a multi-folder window, choose the folder in the Debug80 panel before you build, debug or send a program to hardware. The active editor is not the project selector. A source file can be open from one folder while Debug80 is still pointed at another folder.

## Project Files

Debug80 looks for project configuration in a few locations. The common file is:

```text
debug80.json
```

It also accepts:

```text
.vscode/debug80.json
.debug80.json
package.json under a debug80 key
```

The next chapter uses Debug80 to create `debug80.json`, a starter source file and a build folder.

## A Folder Is Not A Target

The folder is the project container. It may eventually hold several runnable programs.

Debug80 calls each runnable program a target. The target is introduced in the next chapter because it appears after project creation. For now, keep the distinction simple: the folder is where the project lives; the target is what Debug80 launches from that project.

## Before Moving On

You are ready for the next chapter when three facts are true:

- VS Code has the Debug80 extension installed.
- The Debug80 panel is visible in the Run and Debug sidebar.
- The folder you want to use is selected in the Project row.

## Local VSIX Builds

Most readers should use the Marketplace extension. If you are testing a local build from the `debug80` repository, package and install the VSIX from that repository:

```bash
npm ci
npm run package:check
code --install-extension debug80-0.0.1.vsix --force
```

Reload VS Code after replacing an installed VSIX.
