import { state } from './state.js';
import { showError } from './ui.js';

export async function handleVoteClick(commentId, requestedVoteType, btnElem) {
  if (!state.currentUser) {
    alert("로그인 후 투표할 수 있습니다.");
    return;
  }
  
  const container = btnElem.closest('.vote-group') || btnElem.closest('.vote-area');
  if (!container) return;
  
  const likeBtn = container.querySelector('.btn-like');
  const dislikeBtn = container.querySelector('.btn-dislike');
  const likeCountSpan = container.querySelector('.like-count');
  const dislikeCountSpan = container.querySelector('.dislike-count');
  
  const originalState = {
    isLikeActive: likeBtn.classList.contains('active'),
    isDislikeActive: dislikeBtn.classList.contains('active'),
    likeCount: parseInt(likeCountSpan.textContent, 10) || 0,
    dislikeCount: parseInt(dislikeCountSpan.textContent, 10) || 0
  };
  
  const currentVoteType = originalState.isLikeActive ? 'like' : (originalState.isDislikeActive ? 'dislike' : null);
  
  let newLikeCount = originalState.likeCount;
  let newDislikeCount = originalState.dislikeCount;
  let action = 'INSERT'; 
  
  if (currentVoteType === requestedVoteType) {
    action = 'DELETE';
    if (requestedVoteType === 'like') newLikeCount = Math.max(0, newLikeCount - 1);
    if (requestedVoteType === 'dislike') newDislikeCount = Math.max(0, newDislikeCount - 1);
    btnElem.classList.remove('active');
  } else {
    if (currentVoteType) {
      action = 'UPDATE';
      if (currentVoteType === 'like') newLikeCount = Math.max(0, newLikeCount - 1);
      if (currentVoteType === 'dislike') newDislikeCount = Math.max(0, newDislikeCount - 1);
    } else {
      action = 'INSERT';
    }
    
    if (requestedVoteType === 'like') {
      newLikeCount++;
      likeBtn.classList.add('active');
      dislikeBtn.classList.remove('active');
    } else {
      newDislikeCount++;
      dislikeBtn.classList.add('active');
      likeBtn.classList.remove('active');
    }
  }
  
  likeCountSpan.textContent = newLikeCount;
  dislikeCountSpan.textContent = newDislikeCount;

  try {
    const supabase = window.supabaseClient;
    if (action === 'DELETE') {
      const { error } = await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', state.currentUser.id);
      if (error) throw error;
    } else if (action === 'INSERT') {
      const { error } = await supabase
        .from('comment_votes')
        .insert([{ comment_id: commentId, user_id: state.currentUser.id, vote_type: requestedVoteType }]);
      if (error) throw error;
    } else if (action === 'UPDATE') {
      const { error } = await supabase
        .from('comment_votes')
        .update({ vote_type: requestedVoteType })
        .eq('comment_id', commentId)
        .eq('user_id', state.currentUser.id);
      if (error) throw error;
    }
  } catch (err) {
    console.error('Vote error:', err);
    showError("투표에 실패했습니다. 잠시 후 다시 시도해주세요.");
    // 롤백
    if (originalState.isLikeActive) likeBtn.classList.add('active'); else likeBtn.classList.remove('active');
    if (originalState.isDislikeActive) dislikeBtn.classList.add('active'); else dislikeBtn.classList.remove('active');
    likeCountSpan.textContent = originalState.likeCount;
    dislikeCountSpan.textContent = originalState.dislikeCount;
  }
}
