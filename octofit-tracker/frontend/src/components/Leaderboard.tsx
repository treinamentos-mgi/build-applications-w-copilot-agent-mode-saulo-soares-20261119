import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

const loadLeaderboard = (path: string) => getJson<LeaderboardResponse>(path);

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardResponse>
      title="Placar"
      description="Compare a pontuação total das equipes."
      path="/api/leaderboard"
      load={loadLeaderboard}
      emptyText="Sem pontuação registrada."
      hasData={({ leaderboard }) => leaderboard.length > 0}
      render={({ leaderboard }) => (
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <caption className="visually-hidden">Classificação das equipes por pontos</caption>
            <thead><tr><th scope="col">Posição</th><th scope="col">Equipe</th><th scope="col">Pontos</th></tr></thead>
            <tbody>
              {leaderboard.map((entry) => (
                <tr key={entry.teamName}>
                  <th scope="row">{entry.rank}</th>
                  <td>{entry.teamName}</td>
                  <td>{entry.totalPoints}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    />
  );
}
