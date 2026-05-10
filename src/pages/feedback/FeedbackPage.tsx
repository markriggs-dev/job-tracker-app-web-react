import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth0 } from '@auth0/auth0-react';
import { MessageSquare, CheckCircle } from 'lucide-react';
import feedbackService from '../../services/feedbackService';
import styles from './FeedbackPage.module.css';

const FeedbackPage = () => {
  const { user } = useAuth0();
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      feedbackService.submit({
        content,
        userId: user?.sub,
        userEmail: user?.email,
        userName: user?.name,
      }),
    onSuccess: () => {
      setSubmitted(true);
      setContent('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) mutation.mutate();
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Feedback</h1>
          <p className={styles.pageSubtitle}>Share thoughts, report issues, or suggest improvements</p>
        </div>
      </div>

      <div className={styles.card}>
        {submitted ? (
          <div className={styles.success}>
            <CheckCircle size={40} strokeWidth={1.5} className={styles.successIcon} />
            <h2 className={styles.successTitle}>Thank you!</h2>
            <p className={styles.successText}>Your feedback has been received.</p>
            <button className={styles.resetBtn} onClick={() => setSubmitted(false)}>
              Send more feedback
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label} htmlFor="feedback-content">
              <MessageSquare size={15} />
              What's on your mind?
            </label>
            <textarea
              id="feedback-content"
              className={styles.textarea}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Describe a bug, suggest a feature, or share general feedback…"
              rows={8}
              disabled={mutation.isPending}
            />
            {mutation.isError && (
              <p className={styles.error}>Something went wrong. Please try again.</p>
            )}
            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={!content.trim() || mutation.isPending}
              >
                {mutation.isPending ? 'Sending…' : 'Send Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
