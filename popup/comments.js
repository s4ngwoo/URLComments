import { state } from './state.js';
import { elements, showLoading, showError, hideError, showState, setSubmitButtonLoading } from './ui.js';

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function renderCommentList(comments, userVotes = {}) {
  elements.commentList.innerHTML = '';
  comments.forEach(item => {
    const li = document.createElement('li');
    li.className = 'comment-item';
    
    const createdDate = new Date(item.created_at).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    let actionsHtml = '';
    if (state.currentUser) {
      if (state.currentUser.id === item.author_id) {
        actionsHtml = `<button class="btn-action" data-action="delete" data-id="${item.id}" title="${chrome.i18n.getMessage('btnDelete') || '삭제'}">🗑️</button>`;
      } else {
        actionsHtml = `<button class="btn-action" data-action="report" data-id="${item.id}" title="${chrome.i18n.getMessage('btnReport') || '신고'}">🚨</button>`;
      }
    }

    const myVote = userVotes[item.id];
    const likeActive = myVote === 'like' ? 'active' : '';
    const dislikeActive = myVote === 'dislike' ? 'active' : '';

    li.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${escapeHtml(item.author_name)}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="comment-date">${createdDate}</span>
          <div class="comment-actions">${actionsHtml}</div>
        </div>
      </div>
      <div class="comment-body">${escapeHtml(item.content)}</div>
      <div class="vote-area">
        <div class="vote-item">
          <button class="btn-vote btn-like ${likeActive}" data-vote-type="like" data-id="${item.id}">👍</button>
          <span class="vote-count like-count">${item.like_count || 0}</span>
        </div>
        <div class="vote-item">
          <button class="btn-vote btn-dislike ${dislikeActive}" data-vote-type="dislike" data-id="${item.id}">👎</button>
          <span class="vote-count dislike-count">${item.dislike_count || 0}</span>
        </div>
      </div>
    `;
    elements.commentList.appendChild(li);
  });
}

export async function loadComments(url) {
  showLoading(chrome.i18n.getMessage("stateLoading"));
  hideError();

  const supabase = window.supabaseClient;
  if (!supabase) {
    showState('empty');
    return;
  }

  try {
    const sortType = elements.sortSelect.value;
    let orderCol = 'created_at';
    let asc = false; 

    if (sortType === 'likes') {
      orderCol = 'like_count';
    } else if (sortType === 'dislikes') {
      orderCol = 'dislike_count';
    }

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('url', url)
      .eq('is_deleted', false)
      .order(orderCol, { ascending: asc });

    if (error) throw error;

    if (!data || data.length === 0) {
      showState('empty');
      return;
    }

    let userVotes = {};
    if (state.currentUser && data.length > 0) {
      const commentIds = data.map(c => c.id);
      const { data: votesData, error: votesError } = await supabase
        .from('comment_votes')
        .select('comment_id, vote_type')
        .in('comment_id', commentIds)
        .eq('user_id', state.currentUser.id);
        
      if (!votesError && votesData) {
        votesData.forEach(v => {
          userVotes[v.comment_id] = v.vote_type;
        });
      }
    }

    renderCommentList(data, userVotes);
    showState('list');

  } catch (err) {
    console.error('Comments fetch exception:', err);
    const errDetail = err.message || JSON.stringify(err);
    showError(chrome.i18n.getMessage("msgLoadCommentsError") + " " + errDetail);
    showState('empty');
  }
}

export async function handleCommentSubmit(e) {
  e.preventDefault();

  if (!state.currentUser) {
    showError(chrome.i18n.getMessage("msgLoginRequiredToWrite"));
    return;
  }

  if (!state.normalizedCurrentUrl) {
    showError(chrome.i18n.getMessage("msgCannotGetUrl"));
    return;
  }

  const content = elements.commentInput.value.trim();

  if (!content) {
    showError(chrome.i18n.getMessage("msgEmptyComment"));
    return;
  }

  if (content.length > 1000) {
    showError(chrome.i18n.getMessage("msgCommentTooLong"));
    return;
  }

  try {
    hideError();
    setSubmitButtonLoading(true);
    
    const supabase = window.supabaseClient;

    const authorName = state.currentUser.user_metadata?.full_name || 
                       state.currentUser.user_metadata?.name || 
                       state.currentUser.email?.split('@')[0] || 
                       chrome.i18n.getMessage("anonymous");

    const { error } = await supabase
      .from('comments')
      .insert([{
        url: state.normalizedCurrentUrl,
        author_id: state.currentUser.id,
        author_name: authorName,
        content: content
      }]);

    if (error) throw error;
    
    elements.commentInput.value = '';
    elements.charCount.textContent = '0 / 1000';
    await loadComments(state.normalizedCurrentUrl);
    
  } catch (err) {
    console.error('Comment post exception:', err);
    const errDetail = err.message || JSON.stringify(err);
    showError(chrome.i18n.getMessage("msgSubmitError") + " " + errDetail);
  } finally {
    setSubmitButtonLoading(false);
  }
}

export async function handleDeleteComment(id) {
  if (!confirm(chrome.i18n.getMessage('msgConfirmDelete'))) return;
  
  try {
    showLoading(chrome.i18n.getMessage("stateLoading"));
    const supabase = window.supabaseClient;
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', id);
      
    if (error) throw error;
    
    alert(chrome.i18n.getMessage('msgDeleteSuccess'));
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Delete error:', err);
    alert(chrome.i18n.getMessage('msgDeleteError') + "\n" + (err.message || ''));
    await loadComments(state.normalizedCurrentUrl);
  }
}

export async function handleReportComment(id) {
  if (!confirm(chrome.i18n.getMessage('msgConfirmReport'))) return;
  
  try {
    showLoading(chrome.i18n.getMessage("stateLoading"));
    const supabase = window.supabaseClient;
    const { error } = await supabase
      .from('reported_comments')
      .insert([{ comment_id: id, reporter_id: state.currentUser.id }]);
      
    if (error) throw error;
    
    alert(chrome.i18n.getMessage('msgReportSuccess'));
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Report error:', err);
    alert(chrome.i18n.getMessage('msgReportError') + "\n" + (err.message || ''));
    await loadComments(state.normalizedCurrentUrl);
  }
}
