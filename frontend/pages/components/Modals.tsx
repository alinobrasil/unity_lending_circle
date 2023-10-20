import Link from "next/link";

export const LoadingModal = () => {
    const Spinner = () => (
        <div className="border-t-4 border-gray-200 border-t-4 border-blue-500 rounded-full w-20 h-20 animate-spin"></div>
    );

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="bg-white p-10 rounded-lg z-10">
                <h2 className="text-xl font-bold mb-2">Loading...</h2>
                {Spinner()}
            </div>
        </div>
    );
}

export const SuccessModal = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 text-center">
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <div className="bg-white p-10 rounded-lg z-10">
                <h2 className="text-xl font-bold mb-2">Success</h2>
                <img src="/checked.png"
                    alt="Success Image"
                    className="w-40 h-40 object-cover rounded-md" />
                <Link href="/">
                    <button className="bg-blue-500 text-white p-2 rounded mt-4">
                        Go To Home
                    </button>
                </Link>
            </div>
        </div>
    );
}
