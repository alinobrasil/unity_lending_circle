// pages/circle/[id]/index.tsx

import { useRouter } from 'next/router';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const Circle = () => {
    const router = useRouter();
    const { id } = router.query; // Destructure the 'id' from the query object

    // Handle cases where the 'id' is not available yet
    if (!id) return <p>Loading...</p>;

    return (
        <div>
            <ConnectButton />
            <h1>Circle Page</h1>
            <p>ID: {id}</p>


        </div>


    );
};

export default Circle;
