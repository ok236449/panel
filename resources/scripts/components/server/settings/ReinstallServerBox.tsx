import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import reinstallServer from '@/api/server/reinstallServer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const [modalVisible, setModalVisible] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'Your server has begun the reinstallation process.',
                });
            })
            .catch((error) => {
                console.error(error);

                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => setModalVisible(false));
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    if(ServerContext.useStoreState((state) => state.server.data!.eggId)!=15){
	ServerContext.useStoreState((state) => state.server.data)!.mcversion = "";
    }
    return (
        <TitledGreyBox title={'Reinstall Server'} css={tw`relative`}>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirm server reinstallation'}
                confirm={'Yes, reinstall server'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
            >
                Your server will be stopped and some files may be deleted or modified during this process, are you sure
                you wish to continue?
            </Dialog.Confirm>
            <p css={tw`text-sm`}>
                Reinstalling your server will stop it, and then re-run the installation script that initially set it
                up.&nbsp;
                <strong css={tw`font-medium`}>
                    Some files may be deleted or modified during this process, please back up your data before
                    continuing.
                </strong>
		{ServerContext.useStoreState((state) => state.server.data!.eggId)!=15?(<span><br/><br/><strong css={tw`font-medium`}>Note:&nbsp;</strong>Using this button will use the version value from startup tab and <strong css={tw`font-medium`}>ignore</strong> the version you may have set in the versions tab. If the version provided doesn't exist, the installation will fail.</span>):("")}
            </p>
	    {ServerContext.useStoreState((state) => state.server.data!.eggId)!=15?(<div css={tw`mt-6 border-l-4 border-cyan-500 p-3`}>
                <p css={tw`font-medium`}>
                    We strongly suggest you to (re)install your server by using the versions tab. That way, the install is guaranteed to work without any problems.
                </p>
            </div>):("")}
	    {ServerContext.useStoreState((state) => state.server.data!.eggId)!=15?(
                <div css={tw`mt-6 text-right`}>
                    <Button.Danger variant={Button.Variants.Secondary} onClick={() => setModalVisible(true)}>
                        Reinstall Server
                    </Button.Danger>
                </div>):(<div css={tw`mt-6 border-l-4 border-cyan-500 p-3`}>
                    <p css={tw`font-medium`}>
                         This server is running a custom version of Minecraft. To reinstall it, please use the versions tab and download the version of your choice.<br/>You may remove all files to get a complete fresh install.
                    </p>
                </div>)}
        </TitledGreyBox>
    );
};
