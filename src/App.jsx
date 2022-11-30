import {
	VStack,
	Container,
	Heading,
	Box,
	Text,
	Button,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import ABI from './utils/WavePortal.json';

const getEthereumObject = () => window.ethereum;

const findMetaMaskAccount = async () => {
	try {
		const ethereum = getEthereumObject();

		/*
		 * First make sure we have access to the Ethereum object.
		 */
		if (!ethereum) {
			console.error('Make sure you have Metamask!');
			return null;
		}

		console.log('We have the Ethereum object', ethereum);
		const accounts = await ethereum.request({ method: 'eth_accounts' });

		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account:', account);
			return account;
		} else {
			console.error('No authorized account found');
			return null;
		}
	} catch (error) {
		console.error(error);
		return null;
	}
};

function App() {
	const [currentAccount, setCurrentAccount] = useState('');

	const contractAddress = '0x7F62224f20bdD8ec9e89b8f1e6197E049fa62F30';
	const contractABI = ABI.abi;

	const connectWallet = async () => {
		try {
			const ethereum = getEthereumObject();
			if (!ethereum) {
				alert('Get MetaMask!');
				return;
			}

			const accounts = await ethereum.request({
				method: 'eth_requestAccounts',
			});

			console.log('Connected', accounts[0]);
			setCurrentAccount(accounts[0]);
		} catch (error) {
			console.error(error);
		}
	};

	const wave = async () => {
		try {
			const { ethereum } = window;

			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const wavePortalContract = new ethers.Contract(
					contractAddress,
					contractABI,
					signer
				);

				let count = await wavePortalContract.getTotalWaves();
				console.log('Retrieved total wave count...', count.toNumber());

				/*
				 * Execute the actual wave from your smart contract
				 */
				const waveTxn = await wavePortalContract.wave();
				console.log('Mining...', waveTxn.hash);

				await waveTxn.wait();
				console.log('Mined -- ', waveTxn.hash);

				count = await wavePortalContract.getTotalWaves();
				console.log('Retrieved total wave count...', count.toNumber());
			} else {
				console.log("Ethereum object doesn't exist!");
			}
		} catch (error) {
			console.log(error);
		}
	};

	// useEffect(async () => {
	// 	const account = await findMetaMaskAccount();
	// 	if (account !== null) {
	// 		setCurrentAccount(account);
	// 	}
	// }, []);

	return (
		<Box
			as='main'
			minH='100vh'
			backgroundColor='gray.900'
			textColor='gray.100'
		>
			<Container maxWidth='container.xl'>
				<VStack
					padding={{ base: 4, lg: '10' }}
					spacing={{ base: '14', lg: '10' }}
				>
					<Heading as='h1' size='4xl'>
						👋 Hey
					</Heading>
					<Text
						fontSize={{ base: 'xl', lg: '2xl' }}
						textAlign='justify'
					>
						This is Moinul. I am a Frontend Focused Full Stack Guy.
						Trying to master web3. This is my first complete dApp
						based on my own smart contract made with Solidity.
						Connect your wallet and Wave me back 🙌
					</Text>

					<Button
						colorScheme='blue'
						size='lg'
						disabled={currentAccount}
					>
						{currentAccount ? 'Wallet Connected' : 'Connect Wallet'}
					</Button>

					<Button
						colorScheme='blue'
						size='lg'
						onClick={wave}
						disabled={!currentAccount}
					>
						👋 Wave me back
					</Button>
				</VStack>
			</Container>
		</Box>
	);
}

export default App;
