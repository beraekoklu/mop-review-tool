# MCAT® Official Prep (MOP) Review Tool
### An *unofficial* review tool for MCAT® Official Prep*

### Installation
This tool has been released on the following web stores for easy installation. Please click on the link for your browser below:
- [Mozilla Firefox](https://addons.mozilla.org/en-US/firefox/addon/mop-review-tool)
- [Google Chrome](https://chrome.google.com/webstore/detail/mop-review-tool/gibehjdihcgpmholbfbmpidgefnfpkod)

Alternatively, if your browser is not listed, you can clone this repository and install the extension manually. Also, please feel free to contact [raj@kundu.io](mailto:raj@kundu.io?subject=MOP%20Review%20Tool%20%2D%20Browser%20Support) or file an issue on GitHub!

#### Loading this fork unpacked
This fork adds support for the newer AAMC **Question Bank** review pages (see below). To run it:
- **Chrome:** go to `chrome://extensions`, enable *Developer mode*, click *Load unpacked*, and select this folder.
- **Firefox:** go to `about:debugging` → *This Firefox* → *Load Temporary Add-on*, and select `manifest.json`.

### Usage

This tool hides/shows answers for easy self-retesting on both **Full Lengths** and the newer **Question Bank** review pages. To use it:
1) Filter questions that you would like to review using the MOP website. Open/enter the review screen which displays the content you wish to review.
2) In quiz mode, answers are hidden at first for every question. To view the answer, you can click on any of the answer choices or press the period (".") key.
3) Advance to the next question, either by clicking the navigation button or using the left/right arrow keys. In quiz mode, the answer choices for the new question will be hidden.

#### Turning it off

**Turn off** in either panel disables the tool completely. Use this while actually sitting a test: with the tool on, answering a question disables the remaining choices, which is exactly what you do not want mid-exam.

While off, no styles are applied, both panels are hidden, and the keyboard shortcuts are dormant. The setting is remembered until you change it.

To turn it back on, either:
- click the small **Review tool off** pill in the bottom-right corner, or
- press `Shift`+`M`, which works even if that pill is covered or off screen.

#### Review filter (question list)

On a question list, MOP lets you filter by correctness *or* by flag, but combines the two with AND — so you cannot ask for "everything I got wrong, plus everything I flagged". This tool adds that union.

Turn on **Show incorrect + flagged** and non-matching rows are hidden. Because the list is paginated and each page is fetched from the server, the tool does not page through the list for you; it simply remembers the matches on each page **you** visit, so the set grows as you browse. **Start review** then steps through everything collected. On each question the panel shows a **‹ position ›** control (e.g. *6 of 16*) to move back and forth through the set, and the **left/right arrow keys** do the same while a review is active. **Reset collected** clears the set, and it resets by itself when you move to a different exam section.

Nothing here talks to MOP's servers: rows are filtered in the page, and each step of a review queue is the same link you would have clicked yourself.

#### Controls

A small control panel sits in the bottom-right of the review screen. It shows which mode you are in, switches between quiz and review, and shows/hides answers — so nothing has to be memorized. Collapse it with the header if it is in the way; the collapsed state is remembered.

Every control also has a keyboard shortcut, printed on the control itself:

- Press `.` to show/hide answers for the current question
- Press `q` to enter quiz mode (hides answers for every question)
- Press `r` to enter review mode (shows answers for every question, like normal)
- Press `h` to collapse/expand the panel

Shortcuts are ignored while you are typing in a text field, so they will not fire while you are writing a note.

By default, every time you enter a question review session, quiz mode is enabled. To disable quiz mode (i.e., enter review mode), use the Review button or the `r` keyboard shortcut as detailed above.

### Screenshots

![Question with answer hidden](./screenshots/answerhidden.png)
![Question with answer shown](./screenshots/answershown.png)

### Feedback

**Please submit any comments, suggestions, or other feedback to [raj@kundu.io](mailto:raj@kundu.io?subject=MOP%20Review%20Tool)!**

#### Attributions
The extension icons ([/icons](/icons)) are from [FontAwesome](https://fontawesome.com).

#### Note*
MCAT® is a registered trademark of the Association of American Medical Colleges (AAMC). This extension is NOT associated with either the MCAT® or the AAMC in any official capacity.
