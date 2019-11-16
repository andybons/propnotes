import './style';
import { ISSUE_DATA } from './data.js';
import { useState, useEffect } from 'preact/hooks';

const AttendeeList = ({ attendees, addAttendee, removeAttendee }) => {
  const members = ['@andybons', '@bradfitz', '@ianlancetaylor', '@rsc', '@spf13', '@griesemer'];
  return (
    <>
      <h2>Attendees</h2>
      <ul className="AttendeeList">
        {members.map(member => {
          return (
            <li className="Attendee" key={member}>
              <label>
                <input
                  className="Attendee-checkbox"
                  type="checkbox"
                  onClick={e => {
                    e.target.checked ? addAttendee(member) : removeAttendee(member);
                  }}
                  checked={attendees.has(member)}
                />
                {member}
              </label>
            </li>
          );
        })}
      </ul>
    </>
  );
};

const Issue = ({ issue, selected, note, onClick, updateNote }) => (
  <li className="Issue">
    <label className="Issue-label">
      <input
        className="Issue-checkbox"
        type="checkbox"
        value={issue.number}
        checked={selected}
        onClick={e => {
          onClick(e.target.checked);
        }}
      />
      <a href={'https://golang.org/issue/' + issue.number} target="_blank" rel="noopener">
        {issue.number}
      </a>{' '}
      {issue.title}
    </label>
    <div hidden={!selected}>
      <textarea
        className="Issue-notes"
        value={note}
        onInput={e => {
          updateNote(issue, e.target.value);
        }}
      />
    </div>
  </li>
);

const IssueList = ({
  issues,
  selectedIssues,
  addSelectedIssue,
  removeSelectedIssue,
  notes,
  updateNote,
}) => {
  const [onlyShowSelected, setOnlyShowSelected] = useState(false);
  const [filter, setFilter] = useState('');

  const filteredIssues = [...issues].filter(issue => {
    if (onlyShowSelected && !selectedIssues.has(issue.number)) {
      return false;
    }
    if (filter.trim() === '') {
      return true;
    }
    let filterLower = filter.toLowerCase();
    return (
      issue.title.toLowerCase().includes(filterLower) ||
      (issue.number + '').toLowerCase().includes(filterLower)
    );
  });

  const handleOnlyShowSelectedClick = e => {
    setOnlyShowSelected(e.target.checked);
  };

  const handleFilterInput = e => {
    setFilter(e.target.value);
  };

  const newIssueClickHandler = issue => {
    return selected => {
      selected ? addSelectedIssue(issue) : removeSelectedIssue(issue);
    };
  };

  return (
    <>
      <div class="IssueListHeader">
        <h2>Issues</h2>
        <label>
          <input type="checkbox" onClick={handleOnlyShowSelectedClick} checked={onlyShowSelected} />{' '}
          Only show selected
        </label>
      </div>
      <label className="Filter">
        <span class="Filter-label">Filter</span>
        <input className="Filter-input" type="text" value={filter} onInput={handleFilterInput} />
      </label>
      <ul className="IssueList">
        {filteredIssues.map(issue => {
          return (
            <Issue
              key={issue.number}
              issue={issue}
              selected={selectedIssues.has(issue.number)}
              onClick={newIssueClickHandler(issue)}
              note={notes[issue.number]}
              updateNote={updateNote}
            ></Issue>
          );
        })}
      </ul>
    </>
  );
};

const MinutesOutput = ({ attendees, issues, selectedIssues, notes }) => {
  const selectText = e => {
    const range = document.createRange();
    range.selectNode(e.target);
    const sel = window.getSelection();
    sel.removeAllRanges(); // required as of Chrome 60: https://www.chromestatus.com/features/6680566019653632
    sel.addRange(range);
  };

  return (
    <>
      <h2>Minutes</h2>
      <pre className="Minutes" onClick={selectText}>
        **
        {new Date().toISOString().substr(0, 10)} /{' '}
        {Array.from(attendees)
          .sort()
          .join(', ')}
        **
        {'\n\n'}
        {issues
          .filter(issue => {
            return selectedIssues.has(issue.number);
          })
          .map(issue => {
            return { ...issue, ['title']: issue.title.replace(/proposal: /i, '') };
          })
          .sort((i1, i2) => i1.title.localeCompare(i2.title))
          .map(issue => {
            return (
              `- #${issue.number} **${issue.title.replace('*', '\\*')}**\n` +
              (notes[issue.number] || '')
                .split('\n')
                .filter(line => line.trim() !== '')
                .map(line => `  - ${line}`)
                .join('\n') +
              '\n'
            );
          })}
      </pre>
    </>
  );
};

const StoreType = {
  SET: 'set', // Set()
  OBJECT: 'object', // {}
};

const useLocalState = (key, typ, initialState) => {
  const jsonVal = window.localStorage.getItem(key);
  if (jsonVal === null) {
    return useState(initialState);
  }
  let state = JSON.parse(jsonVal);
  switch (typ) {
    case StoreType.SET:
      state = new Set(state);
      break;
    case StoreType.OBJECT:
      // No conversion is needed.
      break;
    default:
      throw Error('Unsupported storage type');
  }
  return useState(state);
};

const setLocalState = (key, typ, value) => {
  switch (typ) {
    case StoreType.SET:
      // Set types don’t serialize properly.
      // Convert to an array.
      value = [...value];
      break;
    case StoreType.OBJECT:
      // No conversion is needed.
      break;
    default:
      throw Error('Unsupported storage type');
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

export default function App() {
  const [attendees, setAttendees] = useLocalState('attendees', StoreType.SET, new Set());

  const addAttendee = attendee => {
    attendees.add(attendee);
    setAttendees(new Set(attendees));
  };

  const removeAttendee = attendee => {
    attendees.delete(attendee);
    setAttendees(new Set(attendees));
  };

  const [selectedIssues, setSelectedIssues] = useLocalState(
    'selectedIssues',
    StoreType.SET,
    new Set()
  );

  const addSelectedIssue = issue => {
    selectedIssues.add(issue.number);
    setSelectedIssues(new Set(selectedIssues));
  };

  const removeSelectedIssue = issue => {
    selectedIssues.delete(issue.number);
    setSelectedIssues(new Set(selectedIssues));
  };

  const [notes, updateNotes] = useLocalState('notes', StoreType.OBJECT, {}); // issue number -> notes

  useEffect(() => {
    setLocalState('attendees', StoreType.SET, attendees);
    setLocalState('selectedIssues', StoreType.SET, selectedIssues);
    setLocalState('notes', StoreType.OBJECT, notes);
  });

  return (
    <>
      <header className="Header">
        <h1 className="Header-text">Go Proposal Minutes Generator</h1>
        <span class="Header-storeInfo">Saved locally {new Date().toString()}</span>
      </header>
      <main>
        <div className="App-input">
          <AttendeeList
            attendees={attendees}
            addAttendee={addAttendee}
            removeAttendee={removeAttendee}
          ></AttendeeList>
          <IssueList
            issues={ISSUE_DATA}
            selectedIssues={selectedIssues}
            addSelectedIssue={addSelectedIssue}
            removeSelectedIssue={removeSelectedIssue}
            notes={notes}
            updateNote={(issue, note) => {
              updateNotes({
                ...notes,
                [issue.number]: note,
              });
            }}
          ></IssueList>
        </div>
        <div className="App-output">
          <MinutesOutput
            attendees={attendees}
            issues={ISSUE_DATA}
            selectedIssues={selectedIssues}
            notes={notes}
          ></MinutesOutput>
        </div>
      </main>
    </>
  );
}
