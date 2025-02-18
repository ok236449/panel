import getEggs from '@/api/admin/nests/getEggs';
import importEgg from '@/api/admin/nests/importEgg';
import useFlash from '@/plugins/useFlash';
// import { Editor } from '@/components/elements/editor';
import { useState } from 'react';
import Button from '@/components/elements/Button';
import Modal from '@/components/elements/Modal';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useParams } from 'react-router-dom';
import tw from 'twin.macro';

export default ({ className }: { className?: string }) => {
    const [visible, setVisible] = useState(false);

    const { clearFlashes } = useFlash();

    const params = useParams<'nestId'>();
    const { mutate } = getEggs(Number(params.nestId));

    let fetchFileContent: (() => Promise<string>) | null = null;

    const submit = async () => {
        clearFlashes('egg:import');

        if (fetchFileContent === null) {
            return;
        }

        const egg = await importEgg(Number(params.nestId), await fetchFileContent());
        await mutate(data => ({ ...data!, items: [...data!.items!, egg] }));
        setVisible(false);
    };

    return (
        <>
            <Modal
                visible={visible}
                onDismissed={() => {
                    setVisible(false);
                }}
            >
                <FlashMessageRender byKey={'egg:import'} css={tw`mb-6`} />

                <h2 css={tw`mb-6 text-2xl text-neutral-100`}>Import Egg</h2>

                {/*<Editor*/}
                {/*    // overrides={tw`h-64 rounded`}*/}
                {/*    initialContent={''}*/}
                {/*    // language={jsonLanguage}*/}
                {/*    fetchContent={value => {*/}
                {/*        fetchFileContent = value;*/}
                {/*    }}*/}
                {/*/>*/}

                <div css={tw`flex flex-wrap justify-end mt-4 sm:mt-6`}>
                    <Button
                        type={'button'}
                        css={tw`w-full sm:w-auto sm:mr-2`}
                        onClick={() => setVisible(false)}
                        isSecondary
                    >
                        Cancel
                    </Button>
                    <Button css={tw`w-full sm:w-auto mt-4 sm:mt-0`} onClick={submit}>
                        Import Egg
                    </Button>
                </div>
            </Modal>

            <Button
                type={'button'}
                size={'large'}
                css={tw`h-10 px-4 py-0 whitespace-nowrap`}
                className={className}
                onClick={() => setVisible(true)}
                isSecondary
            >
                Import
            </Button>
        </>
    );
};
