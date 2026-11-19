import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function serviceError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function workoutReason(focus: string, isGoal: boolean) {
  const labels: Record<string, string> = {
    endurance: 'resistência',
    strength: 'força',
    mobility: 'mobilidade',
  };
  const label = labels[focus] ?? focus;
  return isGoal
    ? `Recomendado com base na sua meta de ${label}.`
    : `Recomendado com base na sua atividade recente de ${label}.`;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isObject(input)) throw serviceError(400, 'Informe os dados da atividade.');

  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) {
    throw serviceError(400, 'Informe uma pessoa e uma equipe válidas.');
  }
  if (typeof type !== 'string' || !type.trim()) {
    throw serviceError(400, 'Informe o tipo de atividade.');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw serviceError(400, 'Os minutos da atividade devem ser maiores que zero.');
  }

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw serviceError(404, 'Pessoa ou equipe não encontrada.');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isObject(input)) throw serviceError(400, 'Informe os dados da equipe.');

  const { name, mascot } = input;
  const members = input.members ?? [];
  if (typeof name !== 'string' || !name.trim()) {
    throw serviceError(400, 'Informe o nome da equipe.');
  }
  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw serviceError(400, 'Informe o mascote da equipe.');
  }
  if (!Array.isArray(members) || !members.every(isObjectId)) {
    throw serviceError(400, 'A lista de integrantes contém identificadores inválidos.');
  }

  const memberIds = [...new Set(members)];
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) {
    throw serviceError(404, 'Um ou mais integrantes não foram encontrados.');
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  if (memberIds.length) {
    await Team.updateMany({ _id: { $ne: team._id } }, { $pull: { members: { $in: memberIds } } });
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team;
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw serviceError(404, 'Pessoa não encontrada para este e-mail.');

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentFocus = recentActivities.map(({ type }) => {
    if (['run', 'cycle', 'walk'].includes(type)) return 'endurance';
    return type;
  });
  const preferredFocuses = [...new Set([user.fitnessGoal, ...recentFocus].filter(Boolean))];
  if (!preferredFocuses.length) return [];

  const workouts = await Workout.find({ focus: { $in: preferredFocuses } }).lean();
  workouts.sort((left, right) => preferredFocuses.indexOf(left.focus) - preferredFocuses.indexOf(right.focus));
  return workouts.map((workout) => ({
    ...workout,
    reason: workoutReason(workout.focus, workout.focus === user.fitnessGoal),
  }));
}

export { User };
