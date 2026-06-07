# Debug80 Project Flow Handoff

Context: feedback from `jhlagado/debug80-docs` issue #6 while reviewing Debug80 Book 1, Chapter 1.

## Request

Improve the multi-project workflow in the Debug80 extension so users can add or initialize project folders from the Debug80 UI with less reliance on VS Code menu navigation.

## Current Reader Confusion

- The docs currently tell users to use **File > Add Folder to Workspace** when they want several projects.
- Feedback suggests users are more likely to look for a small `+` button in the Debug80 Project section.
- When a folder is uninitialized, users must choose a platform and press **Initialize**. Feedback asks whether Debug80 could initialize immediately after folder selection if there is no useful reason to delay.

## Product Questions

1. Should the Project section `+` button open the folder picker and add the selected folder to the workspace?
2. After adding a folder, should Debug80 keep the current explicit platform + **Initialize** step, or auto-initialize when a default/selected platform is available?
3. If explicit initialization remains, can the UI make the next required action more obvious after folder selection?
4. When switching between initialized and uninitialized projects, should the runtime panels remain visible, collapse, or show a clearer uninitialized-project placeholder?

## Acceptance Criteria

- A user can add another project folder from the Debug80 Project section without being sent primarily through **File > Add Folder to Workspace**.
- The uninitialized-project state has one obvious next action.
- Switching between initialized and uninitialized projects does not feel like the interface has disappeared or broken.
- Docs can describe the workflow in one direct path using the Debug80 UI.

## Priority

Low to medium. This is workflow polish, not a blocker for the current docs update.
