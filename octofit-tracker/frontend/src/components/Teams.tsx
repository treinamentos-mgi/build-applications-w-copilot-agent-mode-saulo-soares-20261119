import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };
type TeamResponse = { teams: Team[] };

const loadTeams = (path: string) => getJson<TeamResponse>(path);

export default function Teams() {
  return (
    <CapabilityCard<TeamResponse>
      title="Equipes"
      description="Consulte as equipes e seus integrantes."
      path="/api/teams"
      load={loadTeams}
      emptyText="Sem equipes cadastradas."
      hasData={({ teams }) => teams.length > 0}
      render={({ teams }) => (
        <ul className="list-group list-group-flush" aria-label="Equipes cadastradas">
          {teams.map((team) => (
            <li className="list-group-item px-0" key={team.name}>
              <strong>{team.name}</strong>
              <p className="mb-0">Integrantes: {team.members.length ? team.members.join(', ') : 'Nenhum integrante'}</p>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
