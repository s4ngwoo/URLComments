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

  function renderVoteGroup({ likeActive = false, dislikeActive = false, likes = 5, dislikes = 2 } = {}) {
    const container = document.createElement('div');
    container.className = 'vote-group';
    container.innerHTML = `
      <button class="btn-vote btn-like${likeActive ? ' active' : ''}"></button>
      <span class="like-count">${likes}</span>
      <button class="btn-vote btn-dislike${dislikeActive ? ' active' : ''}"></button>
      <span class="dislike-count">${dislikes}</span>
    `;
    document.body.appendChild(container);
    return {
      likeBtn: container.querySelector('.btn-like'),
      dislikeBtn: container.querySelector('.btn-dislike'),
      likeCount: container.querySelector('.like-count'),
      dislikeCount: container.querySelector('.dislike-count'),
    };
  }

  function mockVoteClient({ insertError = null, updateError = null, deleteError = null } = {}) {
    const insert = jest.fn().mockResolvedValue({ error: insertError });
    const deleteSecondEq = jest.fn().mockResolvedValue({ error: deleteError });
    const deleteFirstEq = jest.fn().mockReturnValue({ eq: deleteSecondEq });
    const del = jest.fn().mockReturnValue({ eq: deleteFirstEq });
    const updateSecondEq = jest.fn().mockResolvedValue({ error: updateError });
    const updateFirstEq = jest.fn().mockReturnValue({ eq: updateSecondEq });
    const update = jest.fn().mockReturnValue({ eq: updateFirstEq });
    const from = jest.fn(() => ({ insert, delete: del, update }));
    window.supabaseClient = { from };
    return { insert, delete: del, update, from, deleteSecondEq, updateSecondEq };
  }

  test('INSERT like increments count and persists vote_type', async () => {
    state.currentUser = { id: 'user-1' };
    const uiState = renderVoteGroup();
    const client = mockVoteClient();

    await handleVoteClick(123, 'like', uiState.likeBtn);

    expect(client.from).toHaveBeenCalledWith('comment_votes');
    expect(client.insert).toHaveBeenCalledWith([
      { comment_id: 123, user_id: 'user-1', vote_type: 'like' },
    ]);
    expect(client.update).not.toHaveBeenCalled();
    expect(client.delete).not.toHaveBeenCalled();
    expect(uiState.likeCount.textContent).toBe('6');
    expect(uiState.likeBtn.classList.contains('active')).toBe(true);
    expect(uiState.dislikeBtn.classList.contains('active')).toBe(false);
  });

  test('DELETE like un-votes and decrements the like count', async () => {
    state.currentUser = { id: 'user-1' };
    const uiState = renderVoteGroup({ likeActive: true, likes: 5 });
    const client = mockVoteClient();

    await handleVoteClick(123, 'like', uiState.likeBtn);

    expect(client.delete).toHaveBeenCalled();
    expect(client.deleteSecondEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(client.insert).not.toHaveBeenCalled();
    expect(uiState.likeCount.textContent).toBe('4');
    expect(uiState.likeBtn.classList.contains('active')).toBe(false);
  });

  test('UPDATE like to dislike moves counts and vote_type', async () => {
    state.currentUser = { id: 'user-1' };
    const uiState = renderVoteGroup({ likeActive: true, likes: 5, dislikes: 2 });
    const client = mockVoteClient();

    await handleVoteClick(123, 'dislike', uiState.dislikeBtn);

    expect(client.update).toHaveBeenCalledWith({ vote_type: 'dislike' });
    expect(client.updateSecondEq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(client.insert).not.toHaveBeenCalled();
    expect(uiState.likeCount.textContent).toBe('4');
    expect(uiState.dislikeCount.textContent).toBe('3');
    expect(uiState.likeBtn.classList.contains('active')).toBe(false);
    expect(uiState.dislikeBtn.classList.contains('active')).toBe(true);
  });

  test('rolls back optimistic UPDATE counts when the request fails', async () => {
    state.currentUser = { id: 'user-1' };
    const uiState = renderVoteGroup({ likeActive: true, likes: 5, dislikes: 2 });
    mockVoteClient({ updateError: new Error('network') });

    await handleVoteClick(123, 'dislike', uiState.dislikeBtn);

    expect(ui.showError).toHaveBeenCalled();
    expect(uiState.likeCount.textContent).toBe('5');
    expect(uiState.dislikeCount.textContent).toBe('2');
    expect(uiState.likeBtn.classList.contains('active')).toBe(true);
    expect(uiState.dislikeBtn.classList.contains('active')).toBe(false);
  });
});
