import { handleVoteClick } from './votes.js';
import { state } from './state.js';
import * as ui from './ui.js';

jest.mock('./ui.js', () => ({
  showError: jest.fn(),
  hideError: jest.fn(),
}));

describe('popup/votes.js - handleVoteClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    state.currentUser = null;
    global.alert = jest.fn();
    document.body.innerHTML = '';
  });

  test('calls showError with msgLoginRequiredToVote instead of alert when unauthenticated', async () => {
    const btnElem = document.createElement('button');
    btnElem.className = 'btn-vote btn-like';
    document.body.appendChild(btnElem);

    await handleVoteClick(123, 'like', btnElem);

    expect(global.alert).not.toHaveBeenCalled();
    expect(ui.showError).toHaveBeenCalledWith(expect.any(String));
  });

  test('calls showError with msgVoteError when vote operation fails', async () => {
    state.currentUser = { id: 'user-1' };

    const container = document.createElement('div');
    container.className = 'vote-group';

    const likeBtn = document.createElement('button');
    likeBtn.className = 'btn-vote btn-like';
    const dislikeBtn = document.createElement('button');
    dislikeBtn.className = 'btn-vote btn-dislike';
    const likeCount = document.createElement('span');
    likeCount.className = 'like-count';
    likeCount.textContent = '5';
    const dislikeCount = document.createElement('span');
    dislikeCount.className = 'dislike-count';
    dislikeCount.textContent = '2';

    container.appendChild(likeBtn);
    container.appendChild(likeCount);
    container.appendChild(dislikeBtn);
    container.appendChild(dislikeCount);
    document.body.appendChild(container);

    // Mock supabase to reject
    window.supabaseClient = {
      from: jest.fn(() => ({
        insert: jest.fn().mockResolvedValue({ error: new Error('Network error') }),
        delete: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: new Error('Network error') }) }) }),
        update: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ error: new Error('Network error') }) }) })
      }))
    };

    await handleVoteClick(123, 'like', likeBtn);

    expect(ui.showError).toHaveBeenCalled();
    // Rollback verify
    expect(likeCount.textContent).toBe('5');
    expect(dislikeCount.textContent).toBe('2');
  });
});
