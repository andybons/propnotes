import './style';
import { ISSUE_DATA } from './data.js';
import { Component } from 'preact';

const members = ['@andybons', '@bradfitz', '@ianlancetaylor', '@rsc', '@spf13', '@griesemer'];

export default class App extends Component {
	state = {
		attendees: new Set(),
		filter: '',
		selectedIssues: new Set(),
		notes: {}, // issue number -> notes
	};

	handleAttendeeClick = e => {
		const { checked, value } = e.target;
		this.setState(({ attendees }) => {
			if (checked) {
				attendees.add(value);
			} else {
				attendees.delete(value);
			}
			return {
				attendees: attendees,
			};
		});
	};

	handleIssueClick = e => {
		let { checked, value } = e.target;
		value = +value; // coerce into number
		this.setState(({ selectedIssues }) => {
			if (checked) {
				selectedIssues.add(value);
			} else {
				selectedIssues.delete(value);
			}
			return {
				selectedIssues: selectedIssues,
			};
		});
	};

	handleFilterInput = e => {
		this.setState(prevState => {
			return {
				filter: e.target.value.toLowerCase(),
			};
		});
	};

	handleTextareaInput = (issueNum, e) => {
		this.setState(({ notes }) => {
			notes[issueNum] = e.target.value;
			return {
				notes: notes,
			};
		});
	};

	render({}, { attendees, filter, selectedIssues, notes }) {
		return (
			<app>
				<header>
					<h1>Go Proposal Minutes Generator</h1>
				</header>
				<main>
					<div class="u-column">
						<h2>Input</h2>
						<h3>Attendees</h3>
						<ul>
							{members.map(m => {
								return (
									<li key={m}>
										<label>
											<input type="checkbox" value={m} onClick={this.handleAttendeeClick} />
											{m}
										</label>
									</li>
								);
							})}
						</ul>
						<h3>Issues</h3>
						<label>
							Filter: <input type="text" value={filter} onInput={this.handleFilterInput} />
						</label>
						<ul class="IssueList">
							{ISSUE_DATA.filter(issue => {
								if (filter.trim() === '') {
									return true;
								}
								return (
									issue.title.toLowerCase().includes(filter) ||
									(issue.number + '').toLowerCase().includes(filter)
								);
							}).map(issue => {
								return (
									<li class="IssueList-item" key={issue.number}>
										<label class="IssueList-itemLabel">
											<input
												type="checkbox"
												value={issue.number}
												checked={selectedIssues.has(issue.number)}
												onClick={this.handleIssueClick}
											/>
											<a
												href={'https://golang.org/issue/' + issue.number}
												target="_blank"
												rel="noopener"
											>
												{issue.number}
											</a>{' '}
											{issue.title}
										</label>
										<div hidden={!selectedIssues.has(issue.number)}>
											<textarea
												class="Issue-notes"
												value={notes[issue.number]}
												onInput={this.handleTextareaInput.bind(this, issue.number)}
											/>
										</div>
									</li>
								);
							})}
						</ul>
					</div>
					<aside class="u-column">
						<h2>Output</h2>
						<pre>
							**
							{new Date().toISOString().substr(0, 10)} /{' '}
							{Array.from(attendees)
								.sort()
								.join(', ')}
							**
							{'\n\n'}
							{ISSUE_DATA.filter(issue => {
								return selectedIssues.has(issue.number);
							})
								.map(issue => {
									issue.title = issue.title.replace(/proposal: /i, '');
									return issue;
								})
								.sort((i1, i2) => {
									if (i1.title < i2.title) {
										return -1;
									}
									if (i1.title > i2.title) {
										return 1;
									}
									return 0;
								})
								.map(issue => {
									return (
										`- #${issue.number} **${issue.title.replace('*', '\\*')}**\n` +
										(notes[issue.number] || '')
											.split('\n')
											.filter(line => line.trim() != '')
											.map(line => `  - ${line}`)
											.join('\n') +
										'\n'
									);
								})}
						</pre>
					</aside>
				</main>
			</app>
		);
	}
}
