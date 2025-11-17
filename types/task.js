/**
 * 任务状态枚举
 */
const TaskStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * 任务类型枚举
 */
const TaskType = {
  MUSIC_GENERATION: 'music_generation',
  MUSIC_EXTEND: 'music_extend',
  LYRICS_GENERATION: 'lyrics_generation',
  ADD_VOCALS: 'add_vocals',
  ADD_INSTRUMENTAL: 'add_instrumental'
};

module.exports = {
  TaskStatus,
  TaskType
};

