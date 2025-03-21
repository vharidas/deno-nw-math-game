import _ from 'lodash';
import { Table } from "@sauber/table";
const summarizeGame = ({ questions, scores }) => {
  const qT = new Table();
  qT.theme = Table.roundTheme;
  const names = _.keys(_.first(questions).answers);
  qT.headers = ["#", "Question", "Solution", ...names];
  qT.rows = _.map(questions, (q, i) => ([i + 1, `${q.operation} ${q.operands}`, q.solution, ..._.values(q.answers)]));

  const sT = new Table();
  sT.theme = Table.roundTheme;
  sT.headers = ["Rank", "Player", "Correct", "Incorrect", "Score"];
  sT.rows = _.map(scores, s => [s.rank, s.name, s.correct, s.incorrect, s.score]);
  return _.map([qT, sT], t => t.toString()).join('\n');

}
export {
  summarizeGame
}
