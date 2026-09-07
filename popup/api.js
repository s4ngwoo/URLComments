import { state } from './state.js';
import { getMessage } from './i18n.js';
import { invalidateMyCommentsCache } from './my_comments.js';
import { loadComments } from './comments.js';
import { elements, showLoading, showError, hideError, showState, setSubmitButtonLoading } from './ui.js';
import { resetTextareaSize } from './render.js';

export async function handleCommentSubmit(e) {
  e.preventDefault();

  if (!state.currentUser) {
    showError(getMessage("msgLoginRequiredToWrite"));
    return;
  }

  if (!state.normalizedCurrentUrl) {
    showError(getMessage("msgCannotGetUrl"));
    return;
  }

  const content = elements.commentInput.value.trim();

  if (!content) {
    showError(getMessage("msgEmptyComment"));
    return;
  }

  if (content.length > 1000) {
    showError(getMessage("msgCommentTooLong"));
    return;
  }

  try {
    hideError();
    setSubmitButtonLoading(true);

    const supabase = window.supabaseClient;

    const authorName = state.currentProfile?.display_name ||
      state.currentUser.user_metadata?.full_name ||
      state.currentUser.user_metadata?.name ||
      state.currentUser.email?.split('@')[0] ||
      getMessage("anonymous");

    const { error } = await supabase
      .from('comments')
      .insert([{
        url: state.normalizedCurrentUrl,
        author_id: state.currentUser.id,
        author_name: authorName,
        content: content
      }]);

    if (error) throw error;

    invalidateMyCommentsCache();
    elements.commentInput.value = '';
    elements.charCount.textContent = '0 / 1000';
    resetTextareaSize(elements.commentInput);
    await loadComments(state.normalizedCurrentUrl);

  } catch (err) {
    console.error('Comment post exception:', err);
    showError(getMessage("msgSubmitError") || "댓글 작성에 실패했습니다.");
  } finally {
    setSubmitButtonLoading(false);
  }
}

export async function handleReplySubmit(parentId) {
  if (!state.currentUser) {
    alert(getMessage("msgLoginRequiredToWrite") || "로그인 후 댓글을 작성할 수 있습니다.");
    return;
  }

  const inputEl = document.getElementById(`reply-input-${parentId}`);
  const submitBtn = document.querySelector(`.btn-action-submit-reply[data-parent-id="${parentId}"]`);
  if (!inputEl) return;

  const content = inputEl.value.trim();
  if (!content) {
    alert(getMessage("msgEmptyComment") || "댓글 내용을 입력해주세요.");
    return;
  }

  if (content.length > 1000) {
    alert(getMessage("msgCommentTooLong") || "댓글은 1000자를 초과할 수 없습니다.");
    return;
  }

  const originalBtnText = submitBtn ? submitBtn.textContent : '';

  try {
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '...';
    }

    const supabase = window.supabaseClient;
    const authorName = state.currentProfile?.display_name ||
      state.currentUser.user_metadata?.full_name ||
      state.currentUser.user_metadata?.name ||
      state.currentUser.email?.split('@')[0] ||
      getMessage("anonymous");

    const { error } = await supabase
      .from('comments')
      .insert([{
        url: state.normalizedCurrentUrl,
        author_id: state.currentUser.id,
        author_name: authorName,
        content: content,
        parent_id: parentId
      }]);

    if (error) throw error;

    inputEl.value = '';
    invalidateMyCommentsCache();
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Reply submit error:', err);
    alert((getMessage('msgReplySubmitError') || "답글 등록에 실패했습니다.") + "\\n" + (err.message || ''));
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
}

export async function handleDeleteComment(id) {
  if (!confirm(getMessage('msgConfirmDelete'))) return;

  try {
    showLoading(getMessage("stateLoading"));
    const supabase = window.supabaseClient;

    // 1. Try secure RPC function (Zero-Trust pattern)
    let { error } = await supabase.rpc('soft_delete_comment', {
      p_comment_id: id
    });

    // 2. Fallback to direct update if RPC is not yet registered in database
    if (error && (error.code === 'PGRST202' || error.message?.includes('function') || error.code === '42883')) {
      const fallbackResult = await supabase
        .from('comments')
        .update({ is_deleted: true })
        .eq('id', id);
      error = fallbackResult.error;
    }

    if (error) throw error;

    invalidateMyCommentsCache();
    alert(getMessage('msgDeleteSuccess'));
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Delete error:', err);
    const details = err.message || JSON.stringify(err);
    alert((getMessage('msgDeleteError') || "삭제에 실패했습니다.") + "\\n" + details);
    await loadComments(state.normalizedCurrentUrl);
  }
}

export async function handleReportComment(id) {
  if (!confirm(getMessage('msgConfirmReport'))) return;

  try {
    showLoading(getMessage("stateLoading"));
    const supabase = window.supabaseClient;
    const { error } = await supabase
      .from('reported_comments')
      .insert([{ comment_id: id, reporter_id: state.currentUser.id }]);

    if (error) {
      if (error.code === '23505') {
        alert(getMessage('msgReportDuplicate') || '이미 신고한 댓글입니다.');
        await loadComments(state.normalizedCurrentUrl);
        return;
      }
      throw error;
    }

    alert(getMessage('msgReportSuccess'));
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Report error:', err);
    alert(getMessage('msgReportError') || "신고 처리에 실패했습니다.");
    await loadComments(state.normalizedCurrentUrl);
  }
}

export async function handleEditComment(id, newContent) {
  try {
    showLoading(getMessage("stateLoading"));
    const supabase = window.supabaseClient;
    const { error } = await supabase
      .from('comments')
      .update({ content: newContent })
      .eq('id', id);

    if (error) throw error;

    invalidateMyCommentsCache();
    await loadComments(state.normalizedCurrentUrl);
  } catch (err) {
    console.error('Edit error:', err);
    alert(getMessage('msgEditError') || '댓글 수정 중 오류가 발생했습니다.');
    await loadComments(state.normalizedCurrentUrl);
  }
}
