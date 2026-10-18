import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractSubjectAndTitle,
  parseNaturalLanguagePlan,
  convertParsedTasksToModels,
} from './planParser.ts';

test('planParser - extracts subject and title accurately', () => {
  const ex1 = extractSubjectAndTitle('Physics — EMI revision');
  assert.equal(ex1.subject, 'Physics');
  assert.equal(ex1.title, 'EMI revision');

  const ex2 = extractSubjectAndTitle('Chemistry: Chemical kinetics PYQs');
  assert.equal(ex2.subject, 'Chemistry');
  assert.equal(ex2.title, 'Chemical kinetics PYQs');

  const ex3 = extractSubjectAndTitle('[Maths] Differential equations');
  assert.equal(ex3.subject, 'Maths');
  assert.equal(ex3.title, 'Differential equations');

  const ex4 = extractSubjectAndTitle('- General revision & backlog recovery');
  assert.equal(ex4.subject, 'General');
  assert.equal(ex4.title, 'General revision & backlog recovery');
});

test('planParser - parses structured weekly plan into day buckets', () => {
  const samplePlan = `
WEEKLY PLAN — 19 OCTOBER TO 25 OCTOBER

Monday:
Physics — EMI revision
Chemistry — Chemical kinetics PYQs
Maths — Differential equations

Tuesday:
Physics — EMI practice
Chemistry — Organic reaction revision
Maths — Differential equations PYQs

Wednesday:
Physics — Capacitors
Chemistry — Coordination compounds
Maths — Definite integration
  `;

  const result = parseNaturalLanguagePlan(samplePlan, '2026-10-19');
  assert.equal(result.totalParsed, 9);
  assert.equal(result.detectedWeekStart, '2026-10-19');

  // Verify Monday tasks are mapped to 2026-10-19
  const mondayTasks = result.tasks.filter((t) => t.date === '2026-10-19');
  assert.equal(mondayTasks.length, 3);
  assert.equal(mondayTasks[0].title, 'EMI revision');
  assert.equal(mondayTasks[0].subject, 'Physics');

  // Verify Tuesday tasks are mapped to 2026-10-20
  const tuesdayTasks = result.tasks.filter((t) => t.date === '2026-10-20');
  assert.equal(tuesdayTasks.length, 3);
  assert.equal(tuesdayTasks[1].title, 'Organic reaction revision');

  // Test duplicate prevention
  const { tasksToCreate, skippedCount } = convertParsedTasksToModels(result.tasks, []);
  assert.equal(tasksToCreate.length, 9);
  assert.equal(skippedCount, 0);

  // If we try to import again against existing tasks
  const secondImport = convertParsedTasksToModels(result.tasks, tasksToCreate);
  assert.equal(secondImport.tasksToCreate.length, 0);
  assert.equal(secondImport.skippedCount, 9);
});
