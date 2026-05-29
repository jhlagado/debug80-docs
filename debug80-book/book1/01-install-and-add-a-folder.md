---
layout: default
title: "Install And Add A Folder"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 1
---

[Book 1](index.md) | [Create A TEC-1G Project →](02-create-a-tec1g-project.md)

# Install And Add A Folder

Debug80 runs inside Visual Studio Code. Before you can build anything, you need three things in place: VS Code itself, the Debug80 extension, and a workspace folder for your Z80 project.

Open <https://code.visualstudio.com/> and install the current VS Code build for your operating system. Debug80 declares support for VS Code `1.92.0` and later.

## Install Debug80

Open VS Code and choose **Extensions** from the Activity Bar. Search for `debug80`. The entry you want is **Debug80 IDE for Z80 Development**, published by `jhlagado`; click **Install**. VS Code may then ask you to reload the window, which starts the extension in the current session.

![Debug80 Marketplace entry in VS Code](../../assets/images/debug80-book/book1/marketplace-entry.png)

Debug80 adds syntax highlighting for `.asm` and `.z80` files. It also adds a debugger type called `z80` and a Debug80 view in the **Run and Debug** sidebar.

## Find The Debug80 Panel

Open the **Run and Debug** sidebar. The Debug80 panel appears there because the extension contributes a view named **Debug80** to the debug view.

![Debug80 view in the Run and Debug sidebar](../../assets/images/debug80-book/book1/run-debug-debug80-view.png)

If the panel is hidden, open it from VS Code's view picker.

![View menu with Open View selected](../../assets/images/debug80-book/book1/open-view-menu.png)

![Open View picker showing Debug80](../../assets/images/debug80-book/book1/open-view-debug80-picker.png)

Until you give it a project, the panel asks for one. That empty state is expected, and the rest of this chapter fills it.

## Add A Project Folder

Debug80 works from folders in the VS Code workspace. Each workspace folder is a candidate project: a place for your source files, the build output and the `debug80.json` file that records how to build and run the program. When you point Debug80 at a folder that has no `debug80.json` yet, it can write one and adopt the folder as a project.

So the next move is to add a folder. Open the **File** menu and choose **Add Folder to Workspace**.

![File menu with Add Folder to Workspace selected](../../assets/images/debug80-book/book1/add-folder-menu.png)

You can add an existing folder that already holds your source, or create a fresh one from the folder chooser. The starter walkthrough creates a new folder called `project1`. Whatever you name it, that name is what you will see in the Debug80 Project selector.

![New folder dialog creating project1](../../assets/images/debug80-book/book1/create-project-folder-dialog.png)

Select the new folder and add it to the workspace.

![Folder chooser with project1 selected](../../assets/images/debug80-book/book1/add-project-folder-dialog.png)

A new folder has no `debug80.json`, so Debug80 lists it as uninitialized. It is visible and selectable, and ready to receive a generated `debug80.json`.

![Uninitialized Debug80 project in the Project section](../../assets/images/debug80-book/book1/uninitialized-project-panel.png)

Initializing the folder writes `debug80.json` at its root. From then on the folder is a full Debug80 project: one you can build, debug and send to hardware. The next chapter does the initializing; for now you have a folder in the workspace and a panel that can see it.

When the workspace holds more than one folder, the Project selector chooses which one Debug80 works on. It marks a folder that already contains `debug80.json` as a configured root, and one that does not as needing initialization.

![Project selector showing an uninitialized project1 folder](../../assets/images/debug80-book/book1/select-project-folder-picker.png)

To work on several projects at once, run **File > Add Folder to Workspace** again for each one. Every added folder appears in the Project selector, so you can switch between them without leaving the window.

[Book 1](index.md) | [Create A TEC-1G Project →](02-create-a-tec1g-project.md)
