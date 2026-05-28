---
layout: default
title: "Install And Open A Folder"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 1
---
# Install And Open A Folder

Debug80 runs inside Visual Studio Code. The first job is to install VS Code, add the Debug80 extension and add a folder to the workspace for your Z80 project.

Open <https://code.visualstudio.com/> and install the current VS Code build for your operating system. Debug80 declares support for VS Code `1.92.0` and later.

## Install Debug80

Open VS Code and choose **Extensions** from the Activity Bar. Search for:

```text
Debug80 IDE for Z80 Development
```

Install the extension published by `jhlagado`. After installation, VS Code may ask you to reload the window. Reloading starts the extension in the current VS Code session.

> **Image placeholder:** VS Code Extensions view showing the Debug80 Marketplace entry, with the extension name, publisher and Install button visible.

Debug80 adds syntax highlighting for `.asm` and `.z80` files. It also adds a debugger type called `z80` and a Debug80 view in the **Run and Debug** sidebar.

## Find The Debug80 Panel

Open the **Run and Debug** sidebar. The Debug80 panel appears there because the extension contributes a view named **Debug80** to the debug view.

If the panel is hidden, open the Command Palette and run:

```text
Debug80: Open Debug80 View
```

The panel may say that no Debug80 project exists. That is the expected state before you add and initialize a project folder.

> **Image placeholder:** Run and Debug sidebar with the Debug80 panel visible and no project configured.

> **Image placeholder:** Debug80 panel empty state before a project folder has been opened.

## Read The Empty State

The empty state means VS Code is running Debug80, but the workspace does not yet contain an initialized Debug80 project.

Start by adding a folder to the workspace. Debug80 treats every workspace folder as a possible project. When you select a folder that has not been initialized, Debug80 can turn it into a Debug80 project by writing `debug80.json` at the root of that folder.

Treat the panel as the home position for Debug80 work. VS Code has its own Run and Debug controls, but Debug80 adds the project and hardware context for the selected folder.

## Add Project Folders To The Workspace

Debug80 works from folders in the VS Code workspace. A folder can hold source files, build output and the `debug80.json` file that describes how to build and run the program.

Add a project folder with **File > Add Folder to Workspace**. Choose the folder that should own the Z80 project. If your source files live in `/projects/blink`, add `blink`, not the parent `projects` folder.

Debug80 sees each workspace folder as a possible project. At first, the folder may be uninitialized. That means Debug80 can see the folder, but the folder does not yet contain `debug80.json`.

A Debug80 project is a folder with `debug80.json` at its root. When you initialize the folder, Debug80 writes that file into the folder. After that, the folder becomes a first-class Debug80 project and appears in the Project selector as a project you can build, debug and send to hardware.

For a new project, create an empty folder with a name you can recognize in the Debug80 panel. For an existing project, add the folder that already contains `debug80.json`.

Debug80 can work on multiple projects in the same workspace. To add another project, use **File > Add Folder to Workspace** again. Debug80 will see the added folder and show it in the Project selector.

> **Image placeholder:** Debug80 panel with one uninitialized folder selected in the Project row.

## Project Files

Debug80 project configuration lives in one file at the root of the project folder:

```text
debug80.json
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
