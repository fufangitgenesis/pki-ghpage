import { ActivityLog, ActivityCategory, VitalityEntry, VitalityBonus } from './database';

export interface DailyMetrics {
  totalScore: number;
  focusRatio: number;
  distractionRatio: number;
  productivityThroughput: number;
  totalTimeLogged: number;
  energyFocusCorrelation: {
    high: number;
    medium: number;
    low: number;
  };
}

export function calculateDailyMetrics(
  activities: ActivityLog[],
  categories: ActivityCategory[],
  vitalityEntries: VitalityEntry[],
  vitalityBonuses: VitalityBonus[]
): DailyMetrics {
  // Create category lookup
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  
  // Calculate activity scores
  let totalActivityScore = 0;
  let totalTimeLogged = 0;
  let deepWorkTime = 0;
  let distractionTime = 0;
  let positivePoints = 0;
  
  // Energy-focus correlation tracking
  const energyFocusCorrelation = { high: 0, medium: 0, low: 0 };
  
  activities.forEach(activity => {
    const category = categoryMap.get(activity.categoryId);
    if (!category) return;
    
    totalActivityScore += activity.points;
    totalTimeLogged += activity.duration;
    
    if (activity.points > 0) {
      positivePoints += activity.points;
    }
    
    // Track deep work and distractions
    if (category.name === 'Deep Work') {
      deepWorkTime += activity.duration;
      // Track energy level for deep work
      if (activity.energyLevel === 'High') energyFocusCorrelation.high += activity.duration;
      else if (activity.energyLevel === 'Medium') energyFocusCorrelation.medium += activity.duration;
      else energyFocusCorrelation.low += activity.duration;
    } else if (category.name === 'Distraction') {
      distractionTime += activity.duration;
    }
  });
  
  // Calculate vitality bonus
  const vitalityMap = new Map(vitalityBonuses.map(bonus => [bonus.id, bonus]));
  let totalVitalityScore = 0;
  
  vitalityEntries.forEach(entry => {
    if (entry.completed) {
      const bonus = vitalityMap.get(entry.bonusId);
      if (bonus) {
        totalVitalityScore += bonus.points;
      }
    }
  });
  
  // Calculate final metrics
  const totalScore = totalActivityScore + totalVitalityScore;
  const focusRatio = totalTimeLogged > 0 ? (deepWorkTime / totalTimeLogged) * 100 : 0;
  const distractionRatio = totalTimeLogged > 0 ? (distractionTime / totalTimeLogged) * 100 : 0;
  const productivityThroughput = totalTimeLogged > 0 ? positivePoints / (totalTimeLogged / 60) : 0;
  
  return {
    totalScore,
    focusRatio,
    distractionRatio,
    productivityThroughput,
    totalTimeLogged,
    energyFocusCorrelation
  };
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function parseTimeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}