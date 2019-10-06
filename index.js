import './style';
import { ISSUE_DATA } from './data.js';
import { useState } from 'preact/hooks';

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
									value={member}
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
	const [filter, setFilter] = useState('');
	const [filteredIssues, setFilteredIssues] = useState([...issues]);

	const filterIssues = filter => {
		setFilter(filter);
		const filteredIssues = issues.filter(issue => {
			if (filter.trim() === '') {
				return true;
			}
			filter = filter.toLowerCase();
			return (
				issue.title.toLowerCase().includes(filter) ||
				(issue.number + '').toLowerCase().includes(filter)
			);
		});
		setFilteredIssues(filteredIssues);
	};

	return (
		<>
			<h2>Issues</h2>
			<label className="Filter">
				<span class="Filter-label">Filter</span>
				<input
					className="Filter-input"
					type="text"
					value={filter}
					onInput={e => {
						filterIssues(e.target.value);
					}}
				/>
			</label>
			<ul className="IssueList">
				{filteredIssues.map(issue => {
					return (
						<Issue
							key={issue.number}
							issue={issue}
							selected={selectedIssues.has(issue.number)}
							onClick={selected => {
								selected ? addSelectedIssue(issue) : removeSelectedIssue(issue);
							}}
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
	return (
		<>
			<h2>Minutes</h2>
			<pre className="Minutes">
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

export default function App() {
	const [attendees, setAttendees] = useState(new Set());

	const addAttendee = attendee => {
		attendees.add(attendee);
		setAttendees(new Set(attendees));
	};

	const removeAttendee = attendee => {
		attendees.delete(attendee);
		setAttendees(new Set(attendees));
	};

	const [selectedIssues, setSelectedIssues] = useState(new Set());

	const addSelectedIssue = issue => {
		selectedIssues.add(issue.number);
		setSelectedIssues(new Set(selectedIssues));
	};

	const removeSelectedIssue = issue => {
		selectedIssues.delete(issue.number);
		setSelectedIssues(new Set(selectedIssues));
	};

	const [notes, updateNotes] = useState({}); // issue number -> notes

	return (
		<>
			<header className="Header">
				<h1 className="Header-text">Go Proposal Minutes Generator</h1>
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
