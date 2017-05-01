import React, {Component} from 'react';
import * as firebase from 'firebase';
import ReactFireMixin from 'reactfire'
import reactMixin from 'react-mixin'

import logo from './logo.svg';
import './App.css';

var config = {
	apiKey: "AIzaSyBffCZyWfVU5CYnkJH9FGyXrI-U896D4zE",
	authDomain: "flakytests.firebaseapp.com",
	databaseURL: "https://flakytests.firebaseio.com",
	projectId: "flakytests",
	storageBucket: "flakytests.appspot.com",
	messagingSenderId: "629558471777"
};
firebase.initializeApp(config);

var db = firebase.database();

class BuildsList extends Component {
	render() {
		var createBuild = function (item, index) {
			return <li key={item['.key']}>
				<ul> Build {item['.key']}
					{Object.keys(item).filter(function (v) {
						return v !== '.key';
					}).map(function (jobId) {
						var job = item[jobId];
						return <li key={jobId}><span>Job: {jobId}, building {job.commit}
							Tests: <ul>
								{                            Object.keys(job.tests).filter(function (v) {
									return v !== '.key'
								}).map(function (testName) {
									return <li key={testName}>
										{testName}
									</li>
								})
								}		</ul></span></li>;
					})}
				</ul>
			</li>
		};
		return <span>
<ul>
	{this.state.builds.map(createBuild)}
</ul>
</span>
	}

	componentWillMount() {
		this.bindAsArray(db.ref("builds/FlakyTestDetection/" + this.props.proj), "builds");
	}
}

class GHOrg extends Component {

	render() {
		var createProject = function (item, index) {
			return <li key={item}>/{item}
				Builds: <BuildsList proj={item}/>
			</li>
		}
		var createOrg = function (item, index) {
			return <li key={item['.key']}>
				<span>{item['.key']}</span>
				<ul>
					{Object.keys(item).filter(function (v) {
						return v !== '.key';
					}).map(createProject)}
				</ul>
			</li>
		};
		return <ul>{this.props.orgs.map(createOrg)}</ul>
	};
}

class ProjectList extends Component {
	render() {
		return <div>
			<GHOrg orgs={this.state.orgs}/>
		</div>
	};

	componentWillMount() {
		var buildRef = db.ref("MirroredRepos");
		this.bindAsArray(buildRef, 'orgs');
	};


}

reactMixin(ProjectList.prototype, ReactFireMixin)
reactMixin(BuildsList.prototype, ReactFireMixin)


class App extends Component {
	render() {
		return (
			<div className="App">
				<div className="App-header">
					<img src={logo} className="App-logo" alt="logo"/>
					<h2>FlakyTests Dashboard</h2>
				</div>
				<div className="App-intro">
					To get started, edit <code>src/App.js</code> and save to reloa22d.
					test
					<ProjectList />
				</div>
			</div>
		);
	}
}

export default App;
