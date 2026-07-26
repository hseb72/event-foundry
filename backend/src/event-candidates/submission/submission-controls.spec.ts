import { detectSubmissionAnomalies } from './submission-controls';

describe('detectSubmissionAnomalies (FSPEC.22 §13 — contrôles déterministes)', () => {
  const base = {
    title: 'Tournoi',
    startsAt: new Date('2024-07-12T18:00:00.000Z'),
    endsAt: null as Date | null,
    hasPublicDuplicate: false,
    checkDuplicate: false,
  };

  it('Draft conforme → aucune anomalie', () => {
    expect(detectSubmissionAnomalies(base)).toEqual([]);
  });

  it('date de fin antérieure à la date de début → anomalie DATE_COHERENCE', () => {
    const anomalies = detectSubmissionAnomalies({
      ...base,
      endsAt: new Date('2024-07-12T09:00:00.000Z'),
    });
    expect(anomalies.map((a) => a.kind)).toEqual(['DATE_COHERENCE']);
  });

  it('date de fin postérieure à la date de début → conforme', () => {
    const anomalies = detectSubmissionAnomalies({
      ...base,
      endsAt: new Date('2024-07-12T20:00:00.000Z'),
    });
    expect(anomalies).toEqual([]);
  });

  it('doublon détecté et contrôle actif → anomalie DUPLICATE', () => {
    const anomalies = detectSubmissionAnomalies({
      ...base,
      hasPublicDuplicate: true,
      checkDuplicate: true,
    });
    expect(anomalies.map((a) => a.kind)).toEqual(['DUPLICATE']);
  });

  it('doublon présent mais contrôle inactif (événement privé) → conforme', () => {
    const anomalies = detectSubmissionAnomalies({
      ...base,
      hasPublicDuplicate: true,
      checkDuplicate: false,
    });
    expect(anomalies).toEqual([]);
  });

  it('cumul possible : incohérence de dates + doublon', () => {
    const anomalies = detectSubmissionAnomalies({
      ...base,
      endsAt: new Date('2024-07-12T09:00:00.000Z'),
      hasPublicDuplicate: true,
      checkDuplicate: true,
    });
    expect(anomalies.map((a) => a.kind).sort()).toEqual(['DATE_COHERENCE', 'DUPLICATE']);
  });
});
