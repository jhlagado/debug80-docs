---
layout: default
title: "Install And Add A Folder"
parent: "Debug80 Book 1 — Getting Started"
nav_order: 1
---

[Book 1](index.md) | [Create A TEC-1G Project →](02-create-a-tec1g-project.md)

# Install And Add A Folder

Debug80 runs inside Visual Studio Code. Start with VS Code, the Debug80 extension and a workspace folder for your Z80 project.

Open <https://code.visualstudio.com/> and install the current VS Code build for your operating system. Debug80 declares support for VS Code `1.92.0` and later.

## Install Debug80

Open VS Code and choose **Extensions** from the Activity Bar. Search for `debug80`, install **Debug80 IDE for Z80 Development** by `jhlagado`, then reload the window if VS Code asks.

![Debug80 Marketplace entry in VS Code](../../assets/images/debug80-book/book1/marketplace-entry.png)

Debug80 adds syntax highlighting for `.asm` and `.z80` files, a `z80` debugger and a Debug80 view in the **Run and Debug** sidebar.

## Find The Debug80 Panel

Open the **Run and Debug** sidebar. The Debug80 panel appears there with the standard VS Code debug views.

![Debug80 view in the Run and Debug sidebar](../../assets/images/debug80-book/book1/run-debug-debug80-view.png)

If the panel is hidden, open it from VS Code's view picker.

![View menu with Open View selected](../../assets/images/debug80-book/book1/open-view-menu.png)

![Open View picker showing Debug80](../../assets/images/debug80-book/book1/open-view-debug80-picker.png)

## Add A Project Folder

Debug80 works from folders in the VS Code workspace. Each workspace folder is a candidate project: a place for source files, build output and project settings. A folder becomes a Debug80 project after it is initialized.

Open the **File** menu and choose **Add Folder to Workspace**.

![File menu with Add Folder to Workspace selected](../../assets/images/debug80-book/book1/add-folder-menu.png)

You can add an existing folder that already holds your source, or create a fresh one from the folder chooser. This example creates a new folder called `project1`. The folder name appears in the Debug80 Project selector.

![New folder dialog creating project1](../../assets/images/debug80-book/book1/create-project-folder-dialog.png)

Select the new folder and add it to the workspace.

![Folder chooser with project1 selected](../../assets/images/debug80-book/book1/add-project-folder-dialog.png)

A new folder appears in Debug80 as an uninitialized project. It is visible and selectable, but it still needs Debug80 project settings before it can build a target.

![Uninitialized Debug80 project in the Project section](../../assets/images/debug80-book/book1/uninitialized-project-panel.png)

Initializing the folder makes it a full Debug80 project: one you can build, debug and send to hardware.

When the workspace holds more than one folder, the Project selector chooses which one Debug80 works on. It marks initialized projects separately from folders that still need initialization.

![Project selector showing an uninitialized project1 folder](../../assets/images/debug80-book/book1/select-project-folder-picker.png)

To work on several projects at once, run **File > Add Folder to Workspace** again for each one. Every added folder appears in the Project selector.

[Book 1](index.md) | [Create A TEC-1G Project →](02-create-a-tec1g-project.md)
