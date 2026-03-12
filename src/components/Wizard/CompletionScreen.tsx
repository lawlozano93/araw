import { useEffect } from 'react';
import './CompletionScreen.css';

interface CompletionScreenProps {
    onFinish: () => void;
}

export function CompletionScreen({ onFinish }: CompletionScreenProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onFinish();
        }, 3000); // Wait 3 seconds before finishing
        return () => clearTimeout(timer);
    }, [onFinish]);

    return (
        <div className="completion-screen">
            <div className="completion-content">
                <div className="completion-icon">✨</div>
                <h1>Completed Session</h1>
                <p>Great job taking the time to reflect today!</p>
            </div>
        </div>
    );
}
