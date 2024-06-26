import React, {FunctionComponent, useEffect} from 'react';
import {observer} from 'mobx-react-lite';
import {useStyle} from '../../../styles';
import {TextInput} from '../../../components/input';
import {useStore} from '../../../stores';
import {Controller, useForm} from 'react-hook-form';
import {FormattedMessage, useIntl} from 'react-intl';
import {Box} from '../../../components/box';
import {Gutter} from '../../../components/gutter';
import {InteractionManager, Text, View} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import {RootStackParamList, StackNavProp} from '../../../navigation';
import {GuideBox} from '../../../components/guide-box';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import {ScrollViewRegisterContainer} from '../../register/components/scroll-view-register-container';

interface FormData {
  password: string;
}

export const WalletDeleteScreen: FunctionComponent = observer(() => {
  const {keyRingStore} = useStore();

  const navigate = useNavigation<StackNavProp>();
  const intl = useIntl();
  const style = useStyle();
  const route =
    useRoute<RouteProp<RootStackParamList, 'SelectWallet.Delete'>>();
  const vaultId = route.params.id;

  const {
    handleSubmit,
    setFocus,
    setError,
    control,
    formState: {errors},
  } = useForm<FormData>({
    defaultValues: {
      password: '',
    },
  });

  const submit = handleSubmit(async data => {
    try {
      if (vaultId) {
        await keyRingStore.deleteKeyRing(vaultId, data.password);
        if (keyRingStore.isEmpty) {
          navigate.reset({routes: [{name: 'Register'}]});
          return;
        }
        navigate.goBack();
      }
    } catch (e) {
      console.log('Fail to decrypt: ' + e.message);
      setError('password', {
        type: 'custom',
        message: intl.formatMessage({id: 'error.invalid-password'}),
      });
    }
  });
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setFocus('password');
    });
  }, [setFocus]);

  return (
    <ScrollViewRegisterContainer
      bottomButtonStyle={{left: 12, right: 12}}
      contentContainerStyle={style.flatten(['flex-grow-1'])}
      bottomButton={{
        text: intl.formatMessage({id: 'button.confirm'}),
        color: 'primary',
        size: 'large',
        onPress: submit,
      }}>
      <Box padding={12} style={style.flatten(['flex-1'])}>
        <Box>
          {(() => {
            const keyInfo = keyRingStore.keyInfos.find(
              keyInfo => keyInfo.id === vaultId,
            );
            if (!keyInfo) {
              return null;
            }

            if (keyInfo.type === 'mnemonic' || keyInfo.type === 'private-key') {
              return (
                <GuideBox
                  color="warning"
                  title={intl.formatMessage({
                    id: 'page.wallet.delete.warning-title',
                  })}
                  paragraph={intl.formatMessage({
                    id: 'page.wallet.delete.warning-paragraph',
                  })}
                  bottom={
                    <TouchableWithoutFeedback
                      onPress={() => {
                        navigate.navigate('SelectWallet.ViewRecoveryPhrase', {
                          id: vaultId,
                        });
                      }}>
                      <Text
                        style={style.flatten([
                          'text-underline',
                          'color-yellow-400',
                          'subtitle4',
                        ])}>
                        <FormattedMessage id="page.wallet.delete.warning-link-text" />
                      </Text>
                    </TouchableWithoutFeedback>
                  }
                />
              );
            }

            return null;
          })()}
          <Box alignX="center">
            <LottieView
              source={require('../../../public/assets/lottie/wallet/delete.json')}
              loop
              autoPlay
              style={{
                height: 180,
                width: 180,
              }}
            />
          </Box>
          <Gutter size={22} />
          <Text
            style={style.flatten([
              'subtitle3',
              'color-text-middle',
              'text-center',
              'padding-x-8',
            ])}>
            <FormattedMessage id="page.wallet.delete.paragraph" />
          </Text>
        </Box>
        <View style={style.flatten(['flex-1'])} />

        <Box>
          <React.Fragment>
            <Controller
              control={control}
              name="password"
              defaultValue=""
              render={({field: {value, onChange, onBlur, ref}}) => {
                return (
                  <TextInput
                    label={intl.formatMessage({
                      id: 'page.wallet.delete.password-input-label',
                    })}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    ref={ref}
                    value={value}
                    error={errors.password?.message}
                    returnKeyType="done"
                    secureTextEntry={true}
                    onSubmitEditing={() => {
                      submit();
                    }}
                  />
                );
              }}
            />
          </React.Fragment>
        </Box>
      </Box>
    </ScrollViewRegisterContainer>
  );
});
