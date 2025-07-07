-- Add initial meditation data
INSERT INTO guided_meditations (
    title,
    description,
    theme,
    audio_url,
    duration_seconds
) VALUES 
(
    'Breathing Meditation',
    'A simple breathing meditation to help you relax and center yourself.',
    'relaxation',
    '/audio/Breathing Meditation.mp3',
    600
),
(
    'Body Scan',
    'A guided body scan to release tension and promote relaxation.',
    'relaxation',
    '/audio/Body Scan.mp3',
    900
),
(
    'Loving-Kindness',
    'A meditation to cultivate compassion for yourself and others.',
    'compassion',
    '/audio/Loving-Kindess.mp3',
    720
),
(
    'Mindful Walking',
    'A guided walking meditation to connect with your body and surroundings.',
    'mindfulness',
    '/audio/Mindful Walking.mp3',
    600
);